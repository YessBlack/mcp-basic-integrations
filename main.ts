import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. Crear el servidor - Es la interfaz entre el cliente y el servidor
const server = new McpServer({
  name: "Demo",
  version: "0.0.1",
});

// 2. Definir Herramientas - Permiten al LLM realizar acciones a través del servidor
server.tool(
  "fetch-weather",
  "Tool to fetch the weather of a city",
  {
    city: z.string().describe("City name"),
  },
  async ({ city }) => {
    // Lo que hace la herramienta
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`
    );

    const data = await response.json();

    if (data?.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `City ${city} not found.`,
          },
        ],
      };
    }

    const { latitude, longitude } = data.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=precipitation,temperature_2m,is_day,rain`
    );

    const weatherData = await weatherResponse.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(weatherData, null, 2),
        },
      ],
    };
  }
);

// 3. Escuchar las conexiones del cliente - Permite al servidor recibir conexiones de los clientes
const transport = new StdioServerTransport();
await server.connect(transport);
