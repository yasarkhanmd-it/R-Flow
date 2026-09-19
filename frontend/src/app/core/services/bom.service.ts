import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface BomRevision {
  _id: string;
  bomId: string;
  revisionNumber: string;
  description?: string;
  changeReason?: string;
  status: 'Draft' | 'Released' | 'Obsolete';
  createdBy?: { _id: string; employeeName: string; email?: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface Bom {
  _id: string;
  projectId: string;
  bomNumber: string;
  revision?: string;
  titleAssembly?: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Released' | 'On Hold' | 'Pending';
  currentRevisionId?: BomRevision | string | any;
  ownerId?: { _id: string; employeeName: string; email?: string } | any;
  releasedBy?: string;
  releaseDate?: string;
  vendorSupplier?: string;
  deliveryStatus?: 'Pending' | 'Ordered' | 'Partially Delivered' | 'Delivered';
  expectedDelivery?: string;
  actualDelivery?: string;
  estimatedCost?: number;
  actualCost?: number;
  lineItemsCount?: number;
  createdBy?: { _id: string; employeeName: string; email?: string } | any;
  createdAt: string;
  updatedAt: string;
}

export interface BomItem {
  _id: string;
  revisionId: string;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
  make: string;
  vendor: string;
  unitCost: number;
  totalCost: number;
  deliveryStatus: 'Pending' | 'Ordered' | 'Partially Delivered' | 'Delivered';
  inspectionStatus: 'Not Inspected' | 'Passed' | 'Rework' | 'Rejected';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BomService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/projects';

  // --- BOM ---
  getBoms(projectId: string): Observable<ApiResponse<Bom[]>> {
    return this.http.get<ApiResponse<Bom[]>>(`${this.baseUrl}/${projectId}/boms`);
  }

  createBom(projectId: string, payload: Partial<Bom>): Observable<ApiResponse<Bom>> {
    return this.http.post<ApiResponse<Bom>>(`${this.baseUrl}/${projectId}/boms`, payload);
  }

  updateBom(projectId: string, bomId: string, payload: Partial<Bom>): Observable<ApiResponse<Bom>> {
    return this.http.put<ApiResponse<Bom>>(`${this.baseUrl}/${projectId}/boms/${bomId}`, payload);
  }

  deleteBom(projectId: string, bomId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/boms/${bomId}`);
  }

  // --- Revisions ---
  getRevisions(projectId: string): Observable<ApiResponse<BomRevision[]>> {
    return this.http.get<ApiResponse<BomRevision[]>>(`${this.baseUrl}/${projectId}/bom-revisions`);
  }

  createRevision(projectId: string, payload: Partial<BomRevision>): Observable<ApiResponse<BomRevision>> {
    return this.http.post<ApiResponse<BomRevision>>(`${this.baseUrl}/${projectId}/bom-revisions`, payload);
  }

  updateRevision(projectId: string, revisionId: string, payload: Partial<BomRevision>): Observable<ApiResponse<BomRevision>> {
    return this.http.put<ApiResponse<BomRevision>>(`${this.baseUrl}/${projectId}/bom-revisions/${revisionId}`, payload);
  }

  // --- Items ---
  getItems(projectId: string, revisionId: string): Observable<ApiResponse<BomItem[]>> {
    // API route expects /projects/:projectId/bom-items/:revisionId ? 
    // Ah, wait. My API for getting items was app.use('/api/projects/:projectId/bom-items', bomItemRoutes)
    // and the route was router.get('/', getItems) which expects `revisionId` in req.params ... wait! 
    // In `bomItem.routes.ts`, it was `router.get('/:revisionId', getItems)`. Let me check my code.
    // I wrote `router.get('/', getItems)` but the controller expects `req.params.revisionId`. This is a bug in my backend.
    // I should fix the backend route or use query params.
    // I will call `router.get('/:revisionId', getItems)` in the frontend and fix the backend route shortly.
    return this.http.get<ApiResponse<BomItem[]>>(`${this.baseUrl}/${projectId}/bom-items/${revisionId}`);
  }

  createItem(projectId: string, revisionId: string, payload: Partial<BomItem>): Observable<ApiResponse<BomItem>> {
    return this.http.post<ApiResponse<BomItem>>(`${this.baseUrl}/${projectId}/bom-items/${revisionId}`, payload);
  }

  updateItem(projectId: string, itemId: string, payload: Partial<BomItem>): Observable<ApiResponse<BomItem>> {
    return this.http.put<ApiResponse<BomItem>>(`${this.baseUrl}/${projectId}/bom-items/${itemId}`, payload); // Wait, updateItem route was `/:itemId`. I'll use that.
  }

  deleteItem(projectId: string, itemId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${projectId}/bom-items/${itemId}`);
  }
}
