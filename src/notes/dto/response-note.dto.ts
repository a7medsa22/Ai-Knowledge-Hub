import { ApiProperty } from "@nestjs/swagger";

export class NoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  author: {
    id: string;
    email: string;
    name?: string;
  };

  @ApiProperty({ required: false })
  doc?: {
    id: string;
    title: string;
  };
}