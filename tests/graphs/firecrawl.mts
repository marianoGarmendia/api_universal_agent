import  "@mendable/firecrawl-js";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { z } from "zod";

import dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { model } from "./booking-cal.mjs";

dotenv.config();


const loaderFAQ = async (url:string) => {
    
    const loader = new FireCrawlLoader({
    
      url: url, // The URL to scrape
      apiKey: process.env.FIRECRAWL_API_KEY, // Optional, defaults to `FIRECRAWL_API_KEY` in your env.
      mode: "crawl", // The mode to run the crawler in. Can be "scrape" for single urls or "crawl" for all accessible subpages
      
      params: {
       
        // optional parameters based on Firecrawl API docs
        // For API documentation, visit https://docs.firecrawl.dev
      },
    });
    
    const docs = await loader.load();
    
    if(!docs || !docs[0]?.pageContent) return "No se encontraron preguntas frecuentes sobre los servicios, productos y cobertura de universal assistance, responde a la consulta de otra manera pero sin salirte de contexto";
   
  
    const response = docs[0].pageContent

    if(!response) return "No he podido encontrar información especifica pero continuemos con la consulta";
    return docs[0].pageContent;
}

export const getUniversalFaq = tool(async ({consulta}) => {

    const faq = await loaderFAQ("https://www.universal-assistance.com/cl-la/preguntas-frecuentes.html");
    if(!faq) return "No se encontraron preguntas frecuentes sobre los servicios, productos y cobertura de universal assistance";
    return faq;
},{
    name: "getUniversalFaq",
    description: "Obtiene información importante sobre un listado de preguntas frecuentes sobre los servicios, productos y cobertura de universal assistance",
    schema: z.object({
        consulta: z.string().describe("Consulta a realizar sobre las preguntas frecuentes de universal assistance")
    }),
    
})


export const noticias_y_tendencias = tool(async ({consulta}) => {
const noticias = await loaderFAQ("https://www.universal-assistance.com/uablog/category/noticias-y-tendencias-de-viajes/")

if(!noticias) return "No se encontraron noticias o tendencias de viajes, responde a la consulta de otra manera pero sin salirte de contexto";
if(!consulta) return "No hay una consulta especifica para responder, por favor realiza una consulta sobre las noticias y tendencias de viajes";

const prompt = `según la siguiente consulta del usuario: ${consulta}, responde de la mejor manera posible, pero sin salirte de contexto: ${noticias}`

const response = await model.invoke(prompt)

if(!response || !response.content) return "No se encontraron noticias o tendencias de viajes";



return response.content as string;
},{
    name: "noticias_y_tendencias_de_viaje",
    description: "Obtiene las noticias y tendencias más recientes de viajes, hay algunas recomendaciones, novedades, destinos en auge, promociones",
    schema: z.object({
        consulta: z.string().describe("Consulta a realizar sobre las noticias y tendencias más recientes de viajes, recomendaciones, novedades, destinos en auge, promociones")
    }),
})



