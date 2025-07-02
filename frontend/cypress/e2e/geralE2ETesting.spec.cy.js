import { faker } from '@faker-js/faker/locale/pt_BR'; 

describe('Currículo Fácil - Geração de Currículo Inteligente com Faker.js', () => {
  const APP_URL = 'http://localhost:5173/';

  const selectors = {
    nameInput: 'input[type=text]:nth-child(1)',
    phoneInput: '#root > div > form > input[type=tel]:nth-child(2)',
    emailInput: 'input:nth-child(3)',
    linkedinTextarea: 'textarea:nth-child(4)',
    positionInput: 'input[type=text]:nth-child(5)',
    experienceTextarea: 'textarea:nth-child(6)',
    skillsTextarea: 'textarea:nth-child(7)',
    educationTextarea: 'textarea:nth-child(8)',
    certificationsTextarea: 'textarea:nth-child(9)',
    languagesTextarea: 'textarea:nth-child(10)',
    submitButton: 'button',
  };

  it('Deve preencher o formulário com dados aleatórios do Faker.js e gerar um currículo', () => {
    // Gerando dados aleatórios com Faker.js
    const randomFirstName = faker.person.firstName();
    const randomLastName = faker.person.lastName();
    const randomName = `${randomFirstName} ${randomLastName}`; // Nome completo
    const randomEmail = faker.internet.email({
      firstName: randomFirstName,
      lastName: randomLastName
    }); 
    const randomPhone = faker.phone.number('839########'); // Exemplo de formato de celular (ex: 83912345678)

    cy.visit(APP_URL);

    cy.get('h1').should('contain', 'Currículo Inteligente');

    // Get the form element once to chain commands
    const form = cy.get('#root > div > form');

    // Fill in personal information with random data from Faker.js
    form.find(selectors.nameInput)
      .should('exist')
      .type(randomName);

    form.find(selectors.phoneInput)
      .should('exist')
      .type(randomPhone);

    form.find(selectors.emailInput)
      .should('exist')
      .type(randomEmail);

    form.find(selectors.linkedinTextarea)
      .should('exist')
      .type('https://www.youtube.com/watch?v=hQ01th1G1AE'); // Using the provided URL as is

    // Fill in professional information
    form.find(selectors.positionInput)
      .should('exist')
      .type(faker.person.jobTitle()); // Exemplo: Título de cargo aleatório

    form.find(selectors.experienceTextarea)
      .should('exist')
      .type(faker.lorem.paragraphs(2)); // Exemplo: 2 parágrafos de texto aleatório para experiência

    form.find(selectors.skillsTextarea)
      .should('exist')
      .type('Cypress, React, Node.js, Java, Python, SQL, MongoDB, Docker, Kubernetes, Selenium, Git, Agile, Scrum, Kanban, Test Automation, Continuous Integration, Continuous Deployment, DevOps, Cloud Computing, Microservices, RESTful APIs, GraphQL, Web Development, Mobile Development, UI/UX Design, Performance Optimization, Security Best Practices');

    // Fill in academic and additional information
    form.find(selectors.educationTextarea)
      .should('exist')
      .type('Graduação completa em Ciência da Computação pela Universidade Federal de Campina Grande, MBA em Engenharia de Software pela PUC-Rio');

    form.find(selectors.certificationsTextarea)
      .should('exist')
      .type('CTFL, AWS Practitioner, Scrum Master, Docker Certified Associate');

    form.find(selectors.languagesTextarea)
      .should('exist')
      .type('Ingles B2, Portugues Nativo, Espanhol A2');

    // Submit the form
    form.find(selectors.submitButton)
      .should('exist')
      .click();

    // Add assertions for the next page/state if applicable (e.g., verify success message,
    // or that the generated curriculum is displayed).
  });
});