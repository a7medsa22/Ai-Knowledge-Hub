import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('AI Research')
    .setDescription('The AI Research API')
    .setVersion('1.0')
    .addTag('AI Research')
    .addBearerAuth()
    .build()
   const document = () => SwaggerModule.createDocument(app,config)
   SwaggerModule.setup('swagger',app,document)

  app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true,}))
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
