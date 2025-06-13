import { useState } from 'react'
import '../src/styles.css'
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';


function App() {
  const [formData, setFormData] = useState({ nome: '', cargo: '', experiencias: '', habilidades: '', formacao: '', idiomas: '' });
  const [curriculo, setCurriculo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCurriculoVisible, setIsCurriculoVisible] = useState(false); // NOVO ESTADO: controla a visibilidade do currículo

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('http://localhost:3001/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setCurriculo(data.curriculo);
    setIsCurriculoVisible(true); // NOVO: Abre o currículo automaticamente ao gerar

    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curriculo);
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([curriculo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "curriculo.txt";
    document.body.appendChild(element);
    element.click();
  };

const downloadPdf = () => {
  const element = document.getElementById('curriculo-pdf');
  const opt = {
    margin: 0.5,
    filename: 'curriculo.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 }, // qualidade equilibrada
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
};

const toggleCurriculoVisibility = () => {
    setIsCurriculoVisible(prev => !prev);
  };

  return (
    <div className="container">
      <h1>Currículo Inteligente</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="nome" placeholder="Nome (opcional)" onChange={handleChange} />
        <input name="telefone" type="tel" placeholder="Telefone para contato (opcional)" onChange={handleChange} pattern="[0-9]{10,11}" title="Número de telefone com 10 ou 11 dígitos (apenas números)" />
        <input name="email" placeholder="E-mail" onChange={handleChange} required/>
        <textarea name="links" placeholder="Linkedin, Github profile (opcional)" onChange={handleChange} />
        <input type="text" name="cargo" placeholder="Cargo desejado" onChange={handleChange} required />
        <textarea name="experiencias" placeholder="Experiências" onChange={handleChange} required />
        <textarea name="habilidades" placeholder="Habilidades" onChange={handleChange} required />
        <textarea name="formacao" placeholder="Formação acadêmica" onChange={handleChange} required />
        <textarea name="cursos" placeholder="Certificações e Cursos (opcional)" onChange={handleChange}/>
        <textarea name="idiomas" placeholder="Idiomas" onChange={handleChange} required />
        <button type="submit">{loading ? 'Gerando...' : 'Gerar Currículo com IA'}</button>
      </form>

      {curriculo && (
        <div className="resultado">
          <div className="resultado-header"> {/* NOVO: Para o título e botão de alternar */}
            <h2>Currículo Gerado</h2>
          </div>

          {/* O conteúdo do currículo AGORA É ENVOLVIDO POR UM DIV COM CLASSE CONDICIONAL */}
          <div className={`curriculo-content ${isCurriculoVisible ? 'visible' : 'hidden'}`}>
             <div
               id="curriculo-pdf"
               dangerouslySetInnerHTML={{ __html: marked(curriculo) }}
             />
          </div>

          {/* Botões de download - FICAM SEMPRE VISÍVEIS (fora da div que será oculta) */}
          <div className="download-buttons"> {/* NOVO: Container para os botões */}
            <button onClick={copyToClipboard}>Copiar texto</button>
            <button onClick={downloadTxt}>Baixar como .txt</button>
            <button onClick={downloadPdf}>Baixar como PDF</button>
            <button onClick={toggleCurriculoVisibility} className="toggle-button">
              {isCurriculoVisible ? 'Esconder Currículo' : 'Mostrar Currículo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;