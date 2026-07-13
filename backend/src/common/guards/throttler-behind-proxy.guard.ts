import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  // x-forwarded-for can contain multiple IPs (proxy chain); the first is the original client
  protected async getTracker(req: Request): Promise<string> {
    return await Promise.resolve(
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || ''
    );
  }
}
