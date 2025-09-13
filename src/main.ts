import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true,}))
   
  // Secure the app by setting various HTTP headers
  app.use(helmet());
   
  // Enable CORS for all origins (you can customize this as needed)
  app.enableCors({
    origin:"http://localhost:3000"

  }) 

  const config = new DocumentBuilder()
    .setTitle('AI Research')
    .setDescription('API for AI-powered research and knowledge management platform')
    .setVersion('1.0')
    .addTag('AI Research')
    .addBearerAuth({
      type:"http",
      scheme:"bearer",
      bearerFormat:"JWT",
      name:"JWT",
      description:"JWT Authorization header using the bearer scheme. \n\nEnter JWT token as Bearer + {token}",
      in:"header"
    },
    'JWT-auth'
  )
    .build()
   const document = () => SwaggerModule.createDocument(app,config)
   SwaggerModule.setup('swagger',app,document)

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
