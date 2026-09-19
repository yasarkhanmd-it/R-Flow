import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface Supplier {
  _id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status: string;
}

export interface PurchaseOrderItem {
  _id?: string;
  bomItemId?: string;
  partName: string;
  quantityOrdered: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  _id: string;
  projectId: string;
  poNumber: string;
  supplierId: Supplier;
  status: string;
  totalAmount: number;
  issueDate?: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface GoodsReceiptItem {
  _id?: string;
  poItemId: string;
  quantityReceived: number;
  condition?: string;
}

export interface GoodsReceipt {
  _id: string;
  poId: PurchaseOrder;
  projectId: string;
  receiptNumber: string;
  receiptDate: string;
  status: string;
  items: GoodsReceiptItem[];
  receivedBy: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProcurementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5002/api'; // project-service port

  // Suppliers
  getSuppliers(): Observable<ApiResponse<Supplier[]>> {
    return this.http.get<ApiResponse<Supplier[]>>(`${this.baseUrl}/suppliers`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.baseUrl}/suppliers`, supplier);
  }

  // POs
  getProjectPOs(projectId: string): Observable<ApiResponse<PurchaseOrder[]>> {
    return this.http.get<ApiResponse<PurchaseOrder[]>>(`${this.baseUrl}/projects/${projectId}/pos`);
  }

  createPO(projectId: string, po: Partial<PurchaseOrder>): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${this.baseUrl}/projects/${projectId}/pos`, po);
  }

  // GRNs
  getProjectGRNs(projectId: string, poId: string): Observable<ApiResponse<GoodsReceipt[]>> {
    return this.http.get<ApiResponse<GoodsReceipt[]>>(`${this.baseUrl}/projects/${projectId}/pos/${poId}/receipts`);
  }

  createGRN(projectId: string, poId: string, grn: Partial<GoodsReceipt>): Observable<ApiResponse<GoodsReceipt>> {
    return this.http.post<ApiResponse<GoodsReceipt>>(`${this.baseUrl}/projects/${projectId}/pos/${poId}/receipts`, grn);
  }

  // BOM Material Status
  getMaterialStatus(projectId: string): Observable<ApiResponse<{ ordered: Record<string, number>, received: Record<string, number> }>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/projects/${projectId}/boms/material-status`);
  }
}
