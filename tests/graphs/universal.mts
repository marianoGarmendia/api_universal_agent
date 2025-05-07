import {
  AIMessage,
  
  SystemMessage,
  
  ToolMessage,
  type BaseMessageLike,
} from "@langchain/core/messages";
import {
  type ActionRequest,
  type HumanInterruptConfig,
  type HumanInterrupt,
  type HumanResponse,
} from "@langchain/langgraph/prebuilt";

import { ChatOpenAI } from "@langchain/openai";

import {

  StateGraph,
  interrupt,


  END,
} from "@langchain/langgraph";
import {
  MemorySaver,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";

import {
  pdfTool,
  cotizacion,
  mi_cobertura,
  getPisos2,
} from "./pdf-loader_tool.mjs";
// import { encode } from "gpt-3-encoder";
import { createbookingTool } from "./booking-cal.mjs";
// import { ensureToolCallsHaveResponses } from "./ensure-tool-response.mjs";
import { getUniversalFaq, noticias_y_tendencias } from "./firecrawl.mjs";

import { contexts } from "./contexts.mjs";

// import type { ToolCall } from "openai/resources/beta/threads/runs/steps.mjs";

export const empresa = {
  eventTypeId: contexts.clinica.eventTypeId,
  context: contexts.clinica.context,
};

// process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";
// import * as dotenv from "dotenv";
// dotenv.config();

// const tavilySearch = new TavilySearchResults({
//   apiKey: process.env.TAVILY_API_KEY,
// });

const tools = [mi_cobertura, pdfTool, cotizacion, noticias_y_tendencias,getUniversalFaq ];

const stateAnnotation = MessagesAnnotation;

const newState = Annotation.Root({
  ...stateAnnotation.spec,
  summary: Annotation<string>,
  interruptResponse: Annotation<string>,
});

// export const llmGroq = new ChatGroq({
//   model: "llama-3.3-70b-versatile",
//   apiKey: process.env.GROQ_API_KEY,
//   temperature: 0,
//   maxTokens: undefined,
//   maxRetries: 2,
//   // other params...
// }).bindTools(tools);

export const model = new ChatOpenAI({
  model: "gpt-4o",
  streaming: false,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
}).bindTools(tools);



async function callModel(state: typeof newState.State) {
  const { messages} = state;

 
  const systemsMessage = new SystemMessage(
    `
     Rol:
Eres un asistente virtual de Universal Assistance, diseñado para ayudar a los usuarios con consultas sobre los servicios y productos de la empresa. Debes proporcionar respuestas claras, precisas y útiles en un tono profesional y amigable.

### Saludo Inicial:

-¡Hola! Soy UA, tu asistente universal, y me alegra mucho saludarte. Estoy aquí para ayudarte con lo que necesites: desde resolver dudas y ofrecerte información,   ¿Con qué te gustaría que empecemos hoy? contame...



Instrucciones Generales:
Siempre saluda al usuario y asegúrate de entender bien su pregunta antes de responder.
Brinda información concisa, pero suficiente para resolver la consulta.
Si la pregunta del usuario no está directamente relacionada con Universal Assistance, infórmalo de manera educada.
No inventes respuestas; si no tienes la información, sugiere que el usuario se comunique con atención al cliente.
Uso de Herramientas Disponibles:

Tienes acceso a 5 herramientas que te ayudan a responder mejor:

### 1 - "getUniversalFaq"

Contiene información sobre preguntas frecuentes.
Úsala cuando detectes que la consulta del usuario coincide con alguna de las preguntas listadas en la base de datos de FAQs.
Si la respuesta encontrada es suficiente, preséntala al usuario.
Si la pregunta del usuario requiere información adicional, complementa la respuesta con más detalles de ser necesario.

Este es listado de preguntas frecuentes que puedes responder:
 
¿Por qué elegir Universal Assistance?

¿Por qué viajar con nuestra Asistencia al Viajero?

Nuestros beneficios

Tenemos planes anuales multiviajes.
¿Cómo funcionan?

¿Qué se entiende por “larga estadía”?

¿Puedo personalizar mi cobertura?

Cobertura para tus mascotas

UNI con IA

¿Cómo puedo contratar el servicio?

 
Mi cobertura

¿Cómo funciona la asistencia al viajero?

¿Debo activar el servicio antes de viajar?

¿Cómo descargo mi voucher o certificado?

¿Cómo modifico los datos del voucher?

¿Cuál es mi número de voucher o cobertura?

¿Cómo puedo dar de baja mi cobertura?

¿Qué es VIP Delay?

¿Cómo puedo saber si mi cobertura incluye el servicio de VIP Delay?

¿Cómo funciona VIP Delay?

¿Cómo registro mis vuelos en VipDelay?

¿Queres conocer más del beneficio de VipDelay?

¿Las coberturas anuales se renuevan automáticamente?

¿Puedo cancelar la renovación automática de mi cobertura?

¿Puedo extender mi cobertura en viaje?

 
App

¿Cómo me registro en la APP?

¿Cómo modifico mis datos del perfil?

No recuerdo mi contraseña

No reconoce mis datos

No veo mi cobertura

Solo veo una cobertura

Mi usuario figura inactivo

¿Todos los pasajeros tienen que tener un usuario en la APP?

 
Asistencia en viaje

¿Qué debo hacer si necesito asistencia?

¿Cuáles son los medios de contacto con la Central de Asistencias?

En caso de riesgo de vida, ¿debo comunicarme con ustedes previo a la atención obligatoriamente?

¿Alguien puede solicitar asistencia por mí?

¿Qué es una teleasistencia?

¿Qué es la autogestión médica mobile?

¿Cual es el listado de "prestadores médicos" en el mundo?

¿Qué debo hacer si pierdo mis documentos en viaje?

¿Tengo cobertura dentro de mi país?

Se canceló mi viaje, ¿qué debo hacer?

¿Puedo adquirir una cobertura de asistencia médica estando en viaje?

¿Puedo usar mi asistencia médica a bordo de un crucero?

¿Mi asistencia me cubre traslado o repatriación sanitaria?

 
Reintegros

¿Cómo solicito un reintegro?

¿Cuánto tiempo tengo para presentar un reintegro?

¿Cuáles son los requisitos para solicitar un reintegro?

¿Qué gastos son considerados para el reintegro?

¿En cuánto tiempo me reintegran?

 
Equipaje

¿Qué debería llevar en mi carry on o en el equipaje de mano?

¿Cuáles son las recomendaciones para el equipaje despachado?

¿Qué es un PIR?

¿Qué incluye nuestra asistencia por equipaje?

Estoy en el aeropuerto y mi equipaje no aparece, ¿qué hago?

¿Qué ocurre si mi equipaje no aparece?

El equipaje llegó roto, ¿qué hago?

 
Volví de Viaje

Tuve una Asistencia en el exterior y recibí una notificación del Centro asistencial

Botón de Arrepentimiento o Baja


### 2 - "universal_info_2025"

Contiene información actualizada sobre los servicios, productos y la empresa en 2025.
Úsala cuando la pregunta del usuario no esté en las preguntas frecuentes o cuando se necesite información más reciente.
Si el usuario pregunta sobre nuevos servicios, cambios en políticas o detalles específicos de Universal Assistance en 2025, esta es la fuente principal de información.


### 3 - "noticias_y_tendencias_de_viaje"

Contiene las noticias y tendencias más recientes de viajes. novedades, destinos y recomendaciones.
Úsala cuando el usuario pregunte sobre novedades, destinos en auge, promociones o recomendaciones de viaje.

### 4 - "cotizacion_de_asistencia_de_viaje"

Simula una cotización de Universal Assistance.
Úsala cuando el usuario solicite información sobre cotizaciones.

### 5 - "mi_cobertura"

brinda informacion sobre la cobertura vigente del usuario que consulta.
Recopila la informacion necesaria para brindar una respuesta personalizada sobre la cobertura del usuario.
Úsala cuando el usuario solicite información sobre su cobertura actual.



Ejemplo de Flujo de Conversación:
 Usuario: ¿Cómo descargo mi voucher?
 Agente: Buena pregunta. Déjame verificar la información más reciente sobre cómo descargar tu voucher. (Llamar a getUniversalFaq)
 Agente: Puedes descargar tu voucher ingresando a nuestra app o sitio web en la sección "Mis Coberturas". Si necesitas más ayuda, dime y te guío paso a paso.

 Usuario: ¿Qué novedades hay en los planes de cobertura para 2025?
 Agente: Voy a revisar la información más reciente sobre nuestros planes de cobertura en 2025. (Llamar a universal_info_2025)
 Agente: Para 2025, hemos actualizado nuestras coberturas con nuevas opciones de asistencia médica y beneficios exclusivos. Aquí tienes algunos detalles...

Formato de Respuesta:
Para preguntas simples, responde de manera directa.
Para consultas más complejas, explica paso a paso.
Si es necesario, proporciona enlaces a la página de Universal Assistance o la app.
Si el usuario tiene más dudas, ofrécele continuar con más detalles.
Reglas Adicionales:
No proporciones información que no provenga de las herramientas disponibles.
Nunca compartas información confidencial de la empresa.
Si el usuario está frustrado o molesto, responde con empatía y ofrece soluciones.
Prioriza siempre la información más actualizada.

### Reglas estrictas 
- 
- Las derivaciones a sitios web siempre deben ser de Universal Assistance chile "https://www.universal-assistance.com/cl-la/home.html"
- Las derivaciones para solicitar asistencia debe ser "https://www.universal-assistance.com/cl-la/asistencia.html"
- Para saber sobre tu cobertura debe ser "https://www.universal-assistance.com/cl-la/mi-cobertura.html",
- No menciones nada por fuera de la informacion que tenes de contexto o de las respuestas de las herramientas.
- No des toda información junta, ve dándole la información de a poco, para que el usuario no se sienta abrumado y espera a que te responda para seguir con la conversación.

### ℹ️ Información adicional

- Hoy es **${new Date().toLocaleDateString()}** y la hora actual es **${new Date().toLocaleTimeString()}**.
- Las visitas están disponibles de **lunes a viernes entre las 9:00 y las 18:00 hs**, en bloques de 30 minutos.
- Todos los precios están en **euros**.

  
 `
  );

  const response = await model.invoke([systemsMessage, ...messages]);

  // console.log("response: ", response);

  // const cadenaJSON = JSON.stringify(messages);
  // Tokeniza la cadena y cuenta los tokens
  // const tokens = encode(cadenaJSON);
  // const numeroDeTokens = tokens.length;

  // console.dir( state.messages[state.messages.length - 1], {depth: null});

  // console.log(`Número de tokens: ${numeroDeTokens}`);

  // console.log("------------");

  return { messages: [...messages, response] };

  // console.log(messages, response);

  // We return a list, because this will get added to the existing list
}

function shouldContinue(state: typeof newState.State) {
  const { messages } = state;

  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage?.tool_calls?.length) {
    return "tools";
  } else {
    return END;
  }

  // Otherwise, we stop (reply to the user)
}

const humanNode = (lastMessage: any) => {
 
  const toolArgs = lastMessage.tool_calls[0].args as CoberturaToolArgs
  

  const {
      documento,
      tipo_de_documento   
  } = toolArgs;

  // Define the interrupt request
  const actionRequest: ActionRequest = {
    action: "Confirma tus datos por favor",
    args: toolArgs,
  };

  const description = `Confirma tus datos para consultar tu cobertura: ${JSON.stringify(
    {
     documento,
     tipo_de_documento
    }
  )}`;

  const interruptConfig: HumanInterruptConfig = {
    allow_ignore: false, // Allow the user to `ignore` the interrupt
    allow_respond: false, // Allow the user to `respond` to the interrupt
    allow_edit: true, // Allow the user to `edit` the interrupt's args
    allow_accept: true, // Allow the user to `accept` the interrupt's args
  };

  const request: HumanInterrupt = {
    action_request: actionRequest,
    config: interruptConfig,
    description,
  };

  const humanResponse = interrupt<HumanInterrupt[], HumanResponse[]>([
    request,
  ])[0];
  console.log("request: ", request);

  console.log("humanResponse: ", humanResponse);

  if (humanResponse.type === "response") {
    const message = `User responded with: ${humanResponse.args}`;
    return { interruptResponse: message, humanResponse: humanResponse.args };
  } else if (humanResponse.type === "accept") {
    const message = `User accepted with: ${JSON.stringify(humanResponse.args)}`;
    return { interruptResponse: message, humanResponse: humanResponse };
  } else if (humanResponse.type === "edit") {
    const message = `User edited with: ${JSON.stringify(humanResponse.args)}`;
    return { interruptResponse: message, humanResponse: humanResponse.args };
  } else if (humanResponse.type === "ignore") {
    const message = "User ignored interrupt.";
    return { interruptResponse: message, humanResponse: humanResponse };
  }

  return {
    interruptResponse:
      "Unknown interrupt response type: " + JSON.stringify(humanResponse),
  };
};

interface pisosToolArgs {
  habitaciones: string | null;
  precio_aproximado: string;
  zona: string;
  superficie_total: string | null;
  piscina: "si" | "no" | null;
  tipo_operacion: "venta" | "alquiler";
}

interface CoberturaToolArgs {
  documento: string;
  tipo_de_documento: string;
}

interface CotizacionToolArgs {
  destino: string;
  fecha: string;
  pasajeros: string;
}

const toolNodo = async (state: typeof newState.State) => {
  const { messages } = state;

  const lastMessage = messages[messages.length - 1] as AIMessage;
  console.log("toolNodo");
  console.log("-----------------------");
  // console.log(lastMessage);
  // console.log(lastMessage?.tool_calls);

  let toolMessage: BaseMessageLike = "un tool message" as BaseMessageLike;
  if (lastMessage?.tool_calls?.length) {
    const toolName = lastMessage.tool_calls[0].name;
    const toolArgs = lastMessage.tool_calls[0].args as pisosToolArgs & {
      query: string;
    } & { startTime: string; endTime: string } & {
      name: string;
      start: string;
      email: string;
    } & { documento: string; tipo_de_documento: string } & {
      consulta: string;} & CotizacionToolArgs;
    let tool_call_id = lastMessage.tool_calls[0].id as string;

    if (toolName === "Obtener_pisos_en_venta_dos") {
      const responseInterrupt = humanNode(lastMessage);
      if (
        responseInterrupt.humanResponse &&
        typeof responseInterrupt.humanResponse !== "string" &&
        responseInterrupt.humanResponse.args
      ) {
        const toolArgsInterrupt = responseInterrupt.humanResponse
          .args as pisosToolArgs;
        const response = await getPisos2.invoke(toolArgsInterrupt);
        if (typeof response !== "string") {
          toolMessage = new ToolMessage(
            "Hubo un problema al consultar las propiedades intentemoslo nuevamente",
            tool_call_id,
            "Obtener_pisos_en_venta_dos"
          );
        } else {
          toolMessage = new ToolMessage(
            response,
            tool_call_id,
            "Obtener_pisos_en_venta_dos"
          );
        }
      }
    } else if (toolName === "universal_info_2025") {
      const res = await pdfTool.invoke(toolArgs);
      if (typeof res !== "string") {
        toolMessage = new ToolMessage(
          "Hubo un problema al consultar la cobertura intentemoslo nuevamente",
          tool_call_id,
          "universal_info_2025"
        );}
      else{
      toolMessage = new ToolMessage(res, tool_call_id, "universal_info_2025");}
    } else if (toolName === "getUniversalFaq") {
      const res = await getUniversalFaq.invoke(toolArgs);
      toolMessage = new ToolMessage(res, tool_call_id, "getUniversalFaq");
    } else if (toolName === "noticias_y_tendencias_de_viaje") {
      const res = await createbookingTool.invoke(toolArgs);
      toolMessage = new ToolMessage(res, tool_call_id, "noticias_y_tendencias_de_viaje");
    }else if(toolName === "mi_cobertura"){
      const responseInterrupt = humanNode(lastMessage);
      if (
        responseInterrupt.humanResponse &&
        typeof responseInterrupt.humanResponse !== "string" &&
        responseInterrupt.humanResponse.args
      ) {
        const toolArgsInterrupt = responseInterrupt.humanResponse
          .args as CoberturaToolArgs;
        const response = await mi_cobertura.invoke(toolArgsInterrupt);
        if (typeof response !== "string") {
          toolMessage = new ToolMessage(
            "Hubo un problema al consultar las cobertura",
            tool_call_id,
            "mi_cobertura"
          );
        } else {
          toolMessage = new ToolMessage(
            response,
            tool_call_id,
            "mi_cobertura"
          );
        }
      }
    }else if(toolName === "cotizacion_de_asistencia_de_viaje"){
      const res = await cotizacion.invoke(toolArgs);
      if(typeof res !== "string"){
        toolMessage = new ToolMessage("Hubo un problema al consultar la cotización", tool_call_id, "cotizacion_de_asistencia_de_viaje");}
      else{
      toolMessage = new ToolMessage(res, tool_call_id, "mi_cobertura");}
    }
  } else {
    return { messages };
  }
  // tools.forEach((tool) => {
  //   if (tool.name === toolName) {
  //     tool.invoke(lastMessage?.tool_calls?[0]['args']);
  //   }
  // });
  // console.log("toolMessage: ", toolMessage);

  return { messages: [...messages, toolMessage] };
};

// const delete_messages = async (state: typeof newState.State) => {
//   const { messages, summary } = state;
//   console.log("delete_messages");
//   console.log("-----------------------");

//   console.log(messages);

//   let summary_text = "";

//   let messages_parsed: any[] = [];
//   messages_parsed = messages.map((message) => {
//     if (message instanceof AIMessage) {
//       return {
//         ...messages_parsed,
//         role: "assistant",
//         content: message.content,
//       };
//     }
//     if (message instanceof HumanMessage) {
//       return { ...messages_parsed, role: "Human", content: message.content };
//     }
//   });

//   // 1. Filtrar elementos undefined
//   const filteredMessages = messages_parsed.filter(
//     (message) => message !== undefined
//   );

//   // 2. Formatear cada objeto
//   const formattedMessages = filteredMessages.map(
//     (message) => `${message.role}: ${message.content}`
//   );

//   // 3. Unir las cadenas con un salto de línea
//   const prompt_to_messages = formattedMessages.join("\n");

//   if (messages.length > 3) {
//     if (!summary) {
//       const intructions_summary = `Como asistente de inteligencia artificial, tu tarea es resumir los siguientes mensajes para mantener el contexto de la conversación. Por favor, analiza cada mensaje y elabora un resumen conciso que capture la esencia de la información proporcionada, asegurándote de preservar el flujo y coherencia del diálogo 
//         mensajes: ${prompt_to_messages}
//         `;

//       const summary_message = await model.invoke(intructions_summary);
//       summary_text = summary_message.content as string;
//     } else {
//       const instructions_with_summary = `"Como asistente de inteligencia artificial, tu tarea es resumir los siguientes mensajes para mantener el contexto de la conversación y además tener en cuenta el resumen previo de dicha conversación. Por favor, analiza cada mensaje y el resumen y elabora un nuevo resumen conciso que capture la esencia de la información proporcionada, asegurándote de preservar el flujo y coherencia del diálogo.

//       mensajes: ${prompt_to_messages}

//       resumen previo: ${summary}
      
//       `;

//       const summary_message = await model.invoke(instructions_with_summary);

//       summary_text = summary_message.content as string;
//     }

//     const mssageReduced = messages.slice(0, -3).map((message) => {
//       return new RemoveMessage({ id: message.id as string });
//     });

//     const messagesChecked = ensureToolCallsHaveResponses(mssageReduced);

//     return {
//       messages: [...messagesChecked],
//       summary: summary_text,
//     };
//   }
//   return { messages };
// };

const graph = new StateGraph(newState);

graph
  .addNode("agent", callModel)
  .addNode("tools", toolNodo)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

const checkpointer = new MemorySaver();

export const workflow = graph.compile({ checkpointer });
// let config = { configurable: { thread_id: "123" } };

// const response = await workflow.invoke({messages:"dame las noticias ams relevantes de este 2025"}, config)

// console.log("response: ", response);

// const response =  workflow.streamEvents({messages: [new HumanMessage("Hola como estas? ")]}, {configurable: {thread_id: "1563"} , version: "v2" });
// console.log("-----------------------");
// console.log("response: ", response);

// await workflow.stream({messages: [new HumanMessage("Podes consultar mi cobertura?")]}, {configurable: {thread_id: "1563"} , streamMode: "messages" });

// console.log("-----------------------");

// await workflow.stream({messages: [new HumanMessage("Mi dni es 32999482, tipo dni")]}, {configurable: {thread_id: "1563"} , streamMode: "messages" });

// for await (const message of response) {

//   // console.log(message);
//   // console.log(message.content);
//   // console.log(message.tool_calls);

//   console.dir({
//     event: message.event,
//     messages: message.data,

//   },{
//     depth: 3,
//   });
// }

// for await (const message of response) {
//   // console.log(message);

//   console.dir(message, {depth: null});
// }

// await workflow.stream(new Command({resume: true}));

// Implementacion langgraph studio sin checkpointer
// export const workflow = graph.compile();

// MODIFICAR EL TEMA DE HORARIOS
// En el calendar de cal esta configurado el horario de bs.as.
// El agente detecta 3hs mas tarde de lo que es en realidad es.
// Ejemplo: si el agente detecta 16hs, en realidad es 13hs.
// Para solucionar este problema, se debe modificar el horario de la herramienta "create_booking_tool".
// En la herramienta "create_booking_tool" se debe modificar el horario de la variable "start".
// En la variable "start" se debe modificar la hora de la reserva.
