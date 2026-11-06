import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '@core/api/api.config';
import { dataRequest } from '@core/api/api-operators';
import { ApiEnvelope } from '@core/models';

/** Sube imágenes de portada al almacenamiento del backend. */
@Injectable({ providedIn: 'root' })
export class CoverService {
  private readonly http = inject(HttpClient);

  upload(file: File): Observable<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return dataRequest(
      this.http.post<ApiEnvelope<{ url: string; filename: string }>>(
        API_ENDPOINTS.storage.upload,
        formData,
      ),
    );
  }
}
