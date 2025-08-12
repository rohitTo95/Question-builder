// Utility functions for making authenticated API calls with httpOnly cookies

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
}

/**
 * Makes an authenticated API request with credentials included
 */
export const apiRequest = async (
  url: string, 
  options: ApiRequestOptions = {}
): Promise<Response> => {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge headers, giving priority to passed options
  const headers = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const requestOptions: RequestInit = {
    credentials: 'include', // Always include cookies
    headers,
    ...options,
  };

  return fetch(url, requestOptions);
};

/**
 * Makes a GET request with authentication
 */
export const apiGet = (url: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<Response> => {
  return apiRequest(url, { method: 'GET', ...options });
};

/**
 * Makes a POST request with authentication
 */
export const apiPost = (url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<Response> => {
  return apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
};

/**
 * Makes a PUT request with authentication
 */
export const apiPut = (url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<Response> => {
  return apiRequest(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
};

/**
 * Makes a DELETE request with authentication
 */
export const apiDelete = (url: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<Response> => {
  return apiRequest(url, { method: 'DELETE', ...options });
};

/**
 * Makes a PATCH request with authentication
 */
export const apiPatch = (url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<Response> => {
  return apiRequest(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
};

/**
 * Helper function to handle API responses with error handling
 */
export const handleApiResponse = async <T = any>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Makes a POST request with FormData (for file uploads)
 */
export const apiPostFormData = (url: string, formData: FormData, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<Response> => {
  return apiRequest(url, {
    method: 'POST',
    body: formData,
    ...options,
  });
};
