import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { ApprovedUserGuard } from "src/auth/guards/status.guard";

export function ApiAuth(){
    return applyDecorators(
        UseGuards(JwtAuthGuard,ApprovedUserGuard,RolesGuard),
        ApiBearerAuth('jwt-auth'),
       ApiUnauthorizedResponse({ description: 'Unauthorized access' }),
    );
}