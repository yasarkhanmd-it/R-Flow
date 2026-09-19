import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Eye, Edit, Trash2, X, Search, FileText, CheckCircle, Clock, Truck } from 'lucide-angular';
import { ProcurementService, PurchaseOrder, Supplier, GoodsReceipt } from '../../../core/services/procurement.service';
import { AuthService } from '../../../core/services/auth.service';
import { BomService, Bom, BomRevision, BomItem } from '../../../core/services/bom.service';

@Component({
  selector: 'app-project-procurement',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './project-procurement.component.html',
  styles: [`
    .proc-container { padding: 1.5rem; background: #fff; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-draft { background: #f1f5f9; color: #475569; }
    .status-issued { background: #dbeafe; color: #2563eb; }
    .status-partially { background: #fef3c7; color: #d97706; }
    .status-fulfilled { background: #d1fae5; color: #059669; }
  `]
})
export class ProjectProcurementComponent implements OnInit {
  @Input() projectId!: string;

  // Icons
  readonly Plus = Plus; readonly Eye = Eye; readonly Edit = Edit; readonly Trash2 = Trash2;
  readonly X = X; readonly Search = Search; readonly FileText = FileText;
  readonly CheckCircle = CheckCircle; readonly Clock = Clock; readonly Truck = Truck;

  private procurementService = inject(ProcurementService);
  private authService = inject(AuthService);
  private bomService = inject(BomService);

  pos: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  boms: Bom[] = [];
  revisions: BomRevision[] = [];
  bomItems: BomItem[] = [];

  isLoading = false;
  activeTab: 'POs' | 'Suppliers' = 'POs';
  canManage = false;

  // PO Modal
  showPoModal = false;
  poForm: any = {};
  poError = '';
  isSavingPo = false;

  // Supplier Modal
  showSupplierModal = false;
  supplierForm: any = {};
  supplierError = '';
  isSavingSupplier = false;

  // GRN Modal
  showGrnModal = false;
  selectedPo: PurchaseOrder | null = null;
  grnForm: any = {};
  grnError = '';
  isSavingGrn = false;
  poGrns: GoodsReceipt[] = [];

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.canManage = user?.role === 'Manager' || user?.role === 'Unit Head' || user?.role === 'Administrator' || user?.role === 'Lead';
    
    this.loadSuppliers();
    this.loadPOs();
    this.loadBoms();
  }

  loadSuppliers() {
    this.procurementService.getSuppliers().subscribe({
      next: (res) => { if (res.success) this.suppliers = res.data; }
    });
  }

  loadPOs() {
    this.isLoading = true;
    this.procurementService.getProjectPOs(this.projectId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) this.pos = res.data;
      },
      error: () => this.isLoading = false
    });
  }

  loadBoms() {
    this.bomService.getBoms(this.projectId).subscribe({
      next: (res) => {
        if (res.success) {
          this.boms = res.data;
          // Just load latest revision for all BOMs to have items ready?
          // Too complex. We will fetch items when a BOM is selected in the PO creation form.
        }
      }
    });
  }

  // --- Supplier ---
  openSupplierModal() {
    this.supplierForm = { name: '', contactEmail: '', contactPhone: '', address: '', status: 'Active' };
    this.supplierError = '';
    this.showSupplierModal = true;
  }
  closeSupplierModal() { this.showSupplierModal = false; }

  saveSupplier() {
    if (!this.supplierForm.name) return;
    this.isSavingSupplier = true;
    this.procurementService.createSupplier(this.supplierForm).subscribe({
      next: (res) => {
        this.isSavingSupplier = false;
        this.closeSupplierModal();
        this.loadSuppliers();
      },
      error: (err) => {
        this.isSavingSupplier = false;
        this.supplierError = err.error?.message || 'Error saving supplier';
      }
    });
  }

  // --- Purchase Order ---
  openPoModal() {
    this.poForm = { 
      poNumber: 'PO-' + Date.now(), 
      supplierId: '', 
      totalAmount: 0, 
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ partName: '', quantityOrdered: 1, unitPrice: 0 }] 
    };
    this.poError = '';
    this.showPoModal = true;
  }
  closePoModal() { this.showPoModal = false; }

  addPoItem() {
    this.poForm.items.push({ partName: '', quantityOrdered: 1, unitPrice: 0 });
  }
  removePoItem(i: number) {
    this.poForm.items.splice(i, 1);
    this.calculateTotal();
  }
  calculateTotal() {
    this.poForm.totalAmount = this.poForm.items.reduce((acc: number, item: any) => acc + (item.quantityOrdered * item.unitPrice), 0);
  }

  savePo() {
    if (!this.poForm.supplierId) {
      this.poError = 'Supplier is required';
      return;
    }
    this.isSavingPo = true;
    this.procurementService.createPO(this.projectId, this.poForm).subscribe({
      next: (res) => {
        this.isSavingPo = false;
        this.closePoModal();
        this.loadPOs();
      },
      error: (err) => {
        this.isSavingPo = false;
        this.poError = err.error?.message || 'Error saving PO';
      }
    });
  }

  getStatusClass(status: string) {
    switch(status) {
      case 'Draft': return 'status-draft';
      case 'Issued': return 'status-issued';
      case 'Partially Received': return 'status-partially';
      case 'Fulfilled': return 'status-fulfilled';
      default: return 'status-draft';
    }
  }

  // --- Goods Receipt Note (GRN) ---
  openGrnModal(po: PurchaseOrder) {
    this.selectedPo = po;
    this.grnForm = {
      receiptNumber: 'GRN-' + Date.now(),
      items: po.items.map(item => ({
        poItemId: item._id,
        partName: item.partName,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: 0,
        condition: 'Good'
      }))
    };
    this.grnError = '';
    
    // Load existing GRNs for this PO to show history
    this.procurementService.getProjectGRNs(this.projectId, po._id).subscribe({
      next: (res) => {
        if (res.success) this.poGrns = res.data;
      }
    });
    
    this.showGrnModal = true;
  }
  closeGrnModal() { 
    this.showGrnModal = false; 
    this.selectedPo = null;
    this.poGrns = [];
  }

  saveGrn() {
    const itemsToReceive = this.grnForm.items.filter((i: any) => i.quantityReceived > 0);
    if (itemsToReceive.length === 0) {
      this.grnError = 'Please enter received quantity for at least one item.';
      return;
    }

    this.isSavingGrn = true;
    const grnPayload = {
      poId: this.selectedPo!._id,
      receiptNumber: this.grnForm.receiptNumber,
      items: itemsToReceive.map((i: any) => ({
        poItemId: i.poItemId,
        quantityReceived: i.quantityReceived,
        condition: i.condition
      }))
    };

    this.procurementService.createGRN(this.projectId, this.selectedPo!._id, grnPayload as any).subscribe({
      next: (res) => {
        this.isSavingGrn = false;
        this.closeGrnModal();
        this.loadPOs(); // Reload POs to update status
      },
      error: (err) => {
        this.isSavingGrn = false;
        this.grnError = err.error?.message || 'Error saving GRN';
      }
    });
  }
}
