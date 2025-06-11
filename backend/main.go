package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

// CVData define os campos que recebemos do frontend.
type CVData struct {
	Nome         string `json:"nome"`
	Cargo        string `json:"cargo"`
	Experiencias string `json:"experiencias"`
	Habilidades  string `json:"habilidades"`
	Formacao     string `json:"formacao"`
	Idiomas      string `json:"idiomas"`
}

// --- Estruturas para a API do Gemini ---

// GeminiRequest é a estrutura do corpo da requisição para a API Gemini.
type GeminiRequest struct {
	Contents []*Content `json:"contents"`
}

// Content contém as partes da mensagem.
type Content struct {
	Parts []*Part `json:"parts"`
}

// Part contém o texto do prompt.
type Part struct {
	Text string `json:"text"`
}

// GeminiResponse é a estrutura da resposta recebida da API Gemini.
type GeminiResponse struct {
	Candidates []*Candidate `json:"candidates"`
}

// Candidate contém o conteúdo gerado.
type Candidate struct {
	Content *Content `json:"content"`
}

func main() {
	// Carrega as variáveis de ambiente do arquivo .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Aviso: Erro ao carregar arquivo .env. Usando variáveis de ambiente do sistema.")
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("A variável de ambiente GEMINI_API_KEY não foi definida.")
	}

	app := fiber.New()

	// Permite requisições do frontend
    app.Use(cors.New(cors.Config{
        AllowOrigins: "http://localhost:5173", // ou "*" para liberar geral (não recomendado em produção)
        AllowHeaders: "Origin, Content-Type, Accept",
    }))

	// Endpoint para gerar o currículo
	app.Post("/generate", func(c *fiber.Ctx) error {
		var cvData CVData
		if err := c.BodyParser(&cvData); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Dados inválidos no corpo da requisição"})
		}

		// Monta o prompt para a IA
		prompt := fmt.Sprintf(`
Crie um currículo profissional e bem estruturado para %s, com base nas seguintes informações:

Cargo Desejado: %s

Resumo Profissional:
(Crie um parágrafo conciso e impactante que resuma as qualificações e objetivos de %s para o cargo de %s)

Experiências Profissionais:
%s

Habilidades Técnicas e Comportamentais:
%s

Formação Acadêmica:
%s

Idiomas:
%s

---
Instruções de formatação:
- Organize o conteúdo claramente nas seções: "Resumo Profissional", "Experiência Profissional", "Habilidades", "Formação Acadêmica" e "Idiomas".
- Use uma linguagem formal, clara e direta.
- Não utilize emojis ou gírias.
- Destaque os pontos mais relevantes para o cargo desejado.
`, cvData.Nome, cvData.Cargo, cvData.Nome, cvData.Cargo, cvData.Experiencias, cvData.Habilidades, cvData.Formacao, cvData.Idiomas)

		// Prepara a requisição para a API do Gemini
		geminiReqPayload := GeminiRequest{
			Contents: []*Content{
				{
					Parts: []*Part{
						{
							Text: prompt,
						},
					},
				},
			},
		}

		// Converte o payload para JSON
		jsonReq, err := json.Marshal(geminiReqPayload)
		if err != nil {
			log.Printf("Erro ao converter a requisição para JSON: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro interno ao preparar a requisição"})
		}
		
		// Define a URL da API do Gemini
		geminiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=%s", apiKey)

		// Cria a requisição HTTP
		req, err := http.NewRequest("POST", geminiURL, bytes.NewBuffer(jsonReq))
		if err != nil {
			log.Printf("Erro ao criar a requisição HTTP: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro interno ao criar a requisição"})
		}
		req.Header.Set("Content-Type", "application/json")

		// Envia a requisição
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Erro ao chamar a API do Gemini: %v", err)
			return c.Status(http.StatusServiceUnavailable).JSON(fiber.Map{"error": "Erro ao comunicar com a API do Gemini"})
		}
		defer resp.Body.Close()
		
		// Verifica se a resposta da API foi bem-sucedida
		if resp.StatusCode != http.StatusOK {
			var errorBody map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&errorBody)
			log.Printf("API do Gemini retornou um erro: %s - %v", resp.Status, errorBody)
			return c.Status(resp.StatusCode).JSON(fiber.Map{
				"error": "A API do Gemini retornou um erro.",
				"details": errorBody,
			})
		}


		// Decodifica a resposta da API
		var geminiResp GeminiResponse
		if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
			log.Printf("Erro ao decodificar a resposta do Gemini: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro interno ao processar a resposta da API"})
		}

		// Extrai o conteúdo gerado
		if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
			message := geminiResp.Candidates[0].Content.Parts[0].Text
			return c.JSON(fiber.Map{"curriculo": message})
		}
		
		// Retorna um erro se não houver conteúdo na resposta
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "A API não retornou um currículo válido"})
	})

	fmt.Println("Servidor iniciado na porta 3001")
	log.Fatal(app.Listen(":3001"))
}
