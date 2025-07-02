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
	Telefone     string `json:"telefone"`
	Email        string `json:"email"`
	Links        string `json:"links,omitempty"`
	Cargo        string `json:"cargo"`
	Experiencias string `json:"experiencias"`
	Habilidades  string `json:"habilidades"`
	Formacao     string `json:"formacao"`
	Idiomas      string `json:"idiomas"`
	Cursos       string `json:"cursos,omitempty"` // Campo opcional, pode ser vazio
}

// --- Estruturas para a API do Gemini ---

type GeminiRequest struct {
	Contents []*Content `json:"contents"`
}

type Content struct {
	Parts []*Part `json:"parts"`
}

type Part struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []*Candidate `json:"candidates"`
}

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

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173", // ou "*" para liberar geral (não recomendado fazer)
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	app.Post("/generate", func(c *fiber.Ctx) error {
		var cvData CVData
		if err := c.BodyParser(&cvData); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Dados inválidos no corpo da requisição"})
		}

		// Monta o prompt para a IA
		prompt := fmt.Sprintf(`
Crie um currículo profissional, claro, bem estruturado e direto, para o(a) candidato(a) %s, com base nas informações fornecidas abaixo:

- **Telefone:** %s  
- Email: %s  
- Links (LinkedIn, GitHub, portfólio, etc.): %s  
- Cargo desejado: %s

Resumo Profissional:  
Crie um parágrafo conciso e impactante com no máximo 3 linhas que resuma as principais qualificações, experiências e objetivos profissionais de %s para a vaga de %s.

Experiências Profissionais: 
%s

Habilidades Técnicas e Comportamentais:  
%s

Formação Acadêmica:
%s

Certificações e Cursos:  
%s

Idiomas: 
%s

Instruções de formatação e estilo:
- Estruture o currículo com seções bem divididas e com títulos claros: "Resumo Profissional", "Experiência Profissional", "Habilidades", "Formação Acadêmica", "Cursos e Certificados" e "Idiomas".
- Utilize uma linguagem profissional, formal e objetiva.
- Evite emojis, gírias, redundâncias ou destaques desnecessários como asteriscos.
- Destaque os pontos mais relevantes de acordo com o cargo desejado, focando nos diferenciais do(a) candidato(a).
- Elimine qualquer informação irrelevante ou repetida.
- O objetivo é gerar um currículo que chame a atenção de recrutadores pela organização, clareza e alinhamento com a vaga de %s.
- No resumo profissional, não fale sobre as experiencias profissionais, apenas faça um resumo das qualificações e objetivos.
- Nas experiências profissionais, liste as experiências de forma cronológica, começando pela mais recente, e inclua as principais responsabilidades e conquistas.
- Nas experiências, fale sobre as responsabilidades e as skils adquiridas e utilizadas, e não apenas sobre as funções exercidas.

Gere o conteúdo pronto para ser entregue em formato .txt ou PDF.


`, cvData.Nome, cvData.Telefone, cvData.Email, cvData.Links, cvData.Cargo, cvData.Nome, cvData.Cargo, cvData.Experiencias, cvData.Habilidades, cvData.Formacao, cvData.Cursos, cvData.Idiomas, cvData.Cargo)

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

		jsonReq, err := json.Marshal(geminiReqPayload)
		if err != nil {
			log.Printf("Erro ao converter a requisição para JSON: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro interno ao preparar a requisição"})
		}

		geminiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=%s", apiKey)

		req, err := http.NewRequest("POST", geminiURL, bytes.NewBuffer(jsonReq))
		if err != nil {
			log.Printf("Erro ao criar a requisição HTTP: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro interno ao criar a requisição"})
		}
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Erro ao chamar a API do Gemini: %v", err)
			return c.Status(http.StatusServiceUnavailable).JSON(fiber.Map{"error": "Erro ao comunicar com a API do Gemini"})
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			var errorBody map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&errorBody)
			log.Printf("API do Gemini retornou um erro: %s - %v", resp.Status, errorBody)
			return c.Status(resp.StatusCode).JSON(fiber.Map{
				"error":   "A API do Gemini retornou um erro.",
				"details": errorBody,
			})
		}

		var geminiResp GeminiResponse
		if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
			log.Printf("Erro ao decodificar a resposta do Gemini: %v", err)
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro interno ao processar a resposta da API"})
		}

		if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
			message := geminiResp.Candidates[0].Content.Parts[0].Text
			return c.JSON(fiber.Map{"curriculo": message})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "A API não retornou um currículo válido"})
	})

	fmt.Println("Servidor iniciado na porta 3001")
	log.Fatal(app.Listen(":3001"))
}
