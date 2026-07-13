import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Same as @CurrentUser but extracts from WebSocket client.user instead of HTTP request.user
export const CurrentWsUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<{ user?: Record<string, unknown> }>();
    const user = client.user;

    return data ? user?.[data] : user;
  }
);
