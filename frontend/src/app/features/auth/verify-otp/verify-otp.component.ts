import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'
})
export class VerifyOtpComponent implements OnInit, OnDestroy {

  // ── DOM references ─────────────────────────────────────────────────────────
  @ViewChildren('otpBox') otpBoxRefs!: QueryList<ElementRef<HTMLInputElement>>;

  // ── State ──────────────────────────────────────────────────────────────────
  /** Single source of truth: six single-digit strings or '' */
  digits: string[] = ['', '', '', '', '', ''];

  email = '';
  isVerifying = false;
  isResending  = false;
  serverError: string | null = null;

  // ── Timer ──────────────────────────────────────────────────────────────────
  timeRemaining = 300; // 5 minutes
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const email = sessionStorage.getItem('rflow_reset_email');
    if (!email) { this.router.navigate(['/forgot-password']); return; }
    this.email = email;
    this.startTimer();
  }

  ngOnDestroy(): void { this.stopTimer(); }

  // ── Timer helpers ──────────────────────────────────────────────────────────
  private startTimer(): void {
    this.stopTimer();
    this.timeRemaining = 300;
    this.timerHandle = setInterval(() => {
      if (this.timeRemaining > 0) { this.timeRemaining--; }
      else { this.stopTimer(); }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  get formattedTime(): string {
    const m = Math.floor(this.timeRemaining / 60).toString().padStart(2, '0');
    const s = (this.timeRemaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get isTimerExpired(): boolean { return this.timeRemaining === 0; }
  get canResend(): boolean { return this.isTimerExpired && !this.isResending; }

  get otpValue(): string { return this.digits.join(''); }
  get isOtpComplete(): boolean { return this.digits.every(d => d !== ''); }

  // ── Internal helpers ───────────────────────────────────────────────────────
  /** Get all six native input elements */
  private boxes(): HTMLInputElement[] {
    return this.otpBoxRefs.toArray().map(r => r.nativeElement);
  }

  /** Focus box at given index (bounds-checked) */
  private focus(index: number): void {
    const boxes = this.boxes();
    if (index >= 0 && index < boxes.length) {
      boxes[index].focus();
    }
  }

  /**
   * Set a digit: update our model array AND force the DOM value immediately.
   * We bypass Angular's [value] binding for instant DOM sync.
   */
  private writeDigit(index: number, digit: string): void {
    this.digits[index] = digit;
    const boxes = this.boxes();
    if (boxes[index]) { boxes[index].value = digit; }
  }

  /** Wipe all boxes and focus the first one */
  private clearAll(): void {
    for (let i = 0; i < 6; i++) { this.writeDigit(i, ''); }
    this.nextTick(() => this.focus(0));
  }

  /**
   * Focus AFTER Angular's synchronous change detection finishes.
   * Promise.resolve().then() is a microtask — runs immediately after the
   * current JS task (including Angular CD) but before the next paint.
   * This prevents *ngFor re-renders from stealing focus.
   */
  private nextTick(fn: () => void): void {
    Promise.resolve().then(fn);
  }

  /** trackBy for *ngFor — keeps the same DOM elements when digit values change */
  trackByIndex(index: number): number { return index; }

  // ── Event: focus ──────────────────────────────────────────────────────────
  /** When a box is focused, select its content so the next keystroke replaces it */
  onFocus(index: number): void {
    this.boxes()[index]?.select();
  }

  // ── Event: keydown ────────────────────────────────────────────────────────
  /**
   * ALL digit input goes through keydown.
   * We preventDefault() on every key we handle so the browser
   * never modifies the input.value on its own.
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const key = event.key;

    // ── Numeric digit ──
    if (/^\d$/.test(key)) {
      event.preventDefault();
      this.writeDigit(index, key);
      this.serverError = null;
      // Move to next box AFTER Angular change detection finishes
      if (index < 5) {
        this.nextTick(() => this.focus(index + 1));
      }
      // Auto-verify when last box is filled
      if (this.isOtpComplete) {
        this.nextTick(() => this.verify());
      }
      return;
    }

    // ── Backspace ──
    if (key === 'Backspace') {
      event.preventDefault();
      if (this.digits[index] !== '') {
        // Box has a digit → clear it, stay here
        this.writeDigit(index, '');
      } else if (index > 0) {
        // Box already empty → go to previous and clear it
        this.writeDigit(index - 1, '');
        this.nextTick(() => this.focus(index - 1));
      }
      return;
    }

    // ── Delete ──
    if (key === 'Delete') {
      event.preventDefault();
      this.writeDigit(index, '');
      return;
    }

    // ── Arrow navigation ──
    if (key === 'ArrowLeft')  { event.preventDefault(); this.focus(index - 1); return; }
    if (key === 'ArrowRight') { event.preventDefault(); this.focus(index + 1); return; }

    // ── Enter: submit if complete ──
    if (key === 'Enter') {
      event.preventDefault();
      if (this.isOtpComplete) { this.verify(); }
      return;
    }

    // ── Allow Tab (natural focus order) ──
    if (key === 'Tab') { return; }

    // ── Block everything else (letters, symbols, F-keys, etc.) ──
    event.preventDefault();
  }

  // ── Event: paste ─────────────────────────────────────────────────────────
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const raw = event.clipboardData?.getData('text') ?? '';
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (!digits) { return; }

    for (let i = 0; i < 6; i++) {
      this.writeDigit(i, digits[i] ?? '');
    }

    // Focus the box after the last pasted digit (or box 5)
    this.focus(Math.min(digits.length, 5));

    if (this.isOtpComplete) { this.verify(); }
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  verify(): void {
    if (!this.isOtpComplete || this.isVerifying) { return; }
    this.isVerifying = true;
    this.serverError = null;

    this.authService.verifyOtp(this.email, this.otpValue).subscribe({
      next: (res) => {
        this.isVerifying = false;
        if (res.verified) {
          this.stopTimer();
          this.router.navigate(['/reset-password']);
        } else {
          this.serverError = res.message || 'OTP verification failed.';
          this.clearAll();
        }
      },
      error: (err) => {
        this.isVerifying = false;
        this.serverError = err.error?.message || 'Invalid OTP. Please try again.';
        this.clearAll();
      }
    });
  }

  // ── Resend ────────────────────────────────────────────────────────────────
  resendOtp(): void {
    if (!this.canResend) { return; }
    this.isResending = true;
    this.serverError = null;
    this.clearAll();

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.startTimer();
      },
      error: (err) => {
        this.isResending = false;
        this.serverError = err.error?.message || 'Failed to resend OTP. Please try again.';
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goBack(): void {
    this.stopTimer();
    this.router.navigate(['/forgot-password']);
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  getMaskedEmail(): string {
    const [local, domain] = this.email.split('@');
    if (!local || !domain) { return this.email; }
    return `${local.slice(0, 2)}${'*'.repeat(Math.max(0, local.length - 2))}@${domain}`;
  }
}
