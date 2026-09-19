import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Transaction {
  _id: string;
  projectId: string;
  description: string;
  amount: number;
  type: 'Inflow' | 'Outflow';
  category: string;
  date: string;
  status: 'Planned' | 'Pending' | 'Completed';
  createdBy?: { _id: string; employeeName: string; email?: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  budget: number;
  actualCost: number;
  committedCost: number;
  realizedRevenue: number;
  expectedRevenue: number;
  variance: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  getSummary(projectId: string): Observable<ApiResponse<FinancialSummary>> {
    return this.http.get<ApiResponse<FinancialSummary>>(`${this.baseUrl}/${projectId}/transactions/summary`);
  }

  getTransactions(projectId: string): Observable<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>(`${this.baseUrl}/${projectId}/transactions`);
  }

  createTransaction(projectId: string, payload: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(`${this.baseUrl}/${projectId}/transactions`, payload);
  }

  updateTransaction(projectId: string, transactionId: string, payload: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(`${this.baseUrl}/${projectId}/transactions/${transactionId}`, payload);
  }

  deleteTransaction(projectId: string, transactionId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/transactions/${transactionId}`);
  }
}
