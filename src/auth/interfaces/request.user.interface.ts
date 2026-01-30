import { JwtPayload } from './jwt-payload';

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
export interface AuthUserforRes extends JwtPayload {
  name: string;
}
