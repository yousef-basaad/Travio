export declare const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }>;

export declare function securityHeaders(): Promise<
  Array<{ source: string; headers: Array<{ key: string; value: string }> }>
>;
