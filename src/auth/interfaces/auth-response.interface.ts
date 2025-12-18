import { JwtPayload } from "./jwt-payload";
import { AuthUserforRes } from "./request.user.interface";



export interface AuthResponse{
    user: AuthUserforRes;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}