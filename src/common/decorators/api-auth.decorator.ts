import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

export function ApiAuth(){
    return applyDecorators(
        UseGuards(JwtAuthGuard),
        ApiBearerAuth('jwt-auth'),
       ApiUnauthorizedResponse({ description: 'Unauthorized access' }),
    );
}