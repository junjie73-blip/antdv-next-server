namespace Express {
  interface Request {
    user?: any;
    tenantId?: string;
    file?: any;
    [key: string]: any;
  }
}
