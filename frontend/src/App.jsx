import { useState } from 'react';
import '../src/styles.css';
import html2pdf from 'html2pdf.js';
import { marked } from 'marked';

function App() {
  const [formData, setFormData] = useState({ nome: '', cargo: '', experiencias: '', habilidades: '', formacao: '', idiomas: '', telefone: '' }); // Certifique-se que 'telefone' está no estado inicial
  const [curriculo, setCurriculo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCurriculoVisible, setIsCurriculoVisible] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    if (name === 'telefone') {
      newValue = value.replace(/\D/g, ''); 
      if (newValue.length > 0) {
        newValue = newValue.replace(/^(\d{2})(\d)/g, "($1) $2"); 
        if (newValue.length > 9) { 
          newValue = newValue.replace(/(\d{5})(\d)/, "$1-$2"); 
        } else if (newValue.length > 8) { 
          newValue = newValue.replace(/(\d{4})(\d)/, "$1-$2"); 
        }
      }
    }

    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      
      const dataToSend = { ...formData };
      if (dataToSend.telefone) {
        dataToSend.telefone = dataToSend.telefone.replace(/\D/g, ''); 
      }

      const res = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend), 
      });
      const data = await res.json();
      setCurriculo(data.curriculo);
      setIsCurriculoVisible(true);
    } catch (error) {
      console.error("Erro ao gerar currículo:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(curriculo)
        .then(() => console.log('Texto copiado com sucesso!'))
        .catch(err => console.error('Falha ao copiar texto:', err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = curriculo;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Texto copiado com sucesso (fallback)!');
      } catch (err) {
        console.error('Falha ao copiar texto (fallback):', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([curriculo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "curriculo.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadPdf = () => {
    const element = document.getElementById('curriculo-pdf');
    if (!element) {
      console.error("Elemento 'curriculo-pdf' não encontrado para download.");
      return;
    }
    const opt = {
      margin: 0.5,
      filename: 'curriculo.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: true, useCORS: true },
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
        <input type="text" name="nome" placeholder="Nome (opcional)" onChange={handleChange} value={formData.nome} />
        {/* Input de telefone atualizado */}
        <input
          name="telefone"
          type="tel" 
          placeholder="Telefone para contato (opcional)"
          onChange={handleChange}
          value={formData.telefone} 
          maxLength="15" 
        />
        <input name="email" placeholder="E-mail" onChange={handleChange} value={formData.email} required/>
        <textarea name="links" placeholder="Linkedin, Github profile (opcional)" onChange={handleChange} value={formData.links} />
        <input type="text" name="cargo" placeholder="Cargo desejado" onChange={handleChange} value={formData.cargo} required />
        <textarea name="experiencias" placeholder="Experiências" onChange={handleChange} value={formData.experiencias} required />
        <textarea name="habilidades" placeholder="Habilidades" onChange={handleChange} value={formData.habilidades} required />
        <textarea name="formacao" placeholder="Formação acadêmica" onChange={handleChange} value={formData.formacao} required />
        <textarea name="cursos" placeholder="Certificações e Cursos (opcional)" onChange={handleChange} value={formData.cursos} />
        <textarea name="idiomas" placeholder="Idiomas" onChange={handleChange} value={formData.idiomas} required />
        <button type="submit">{loading ? 'Gerando...' : 'Gerar Currículo com IA'}</button>
      </form>

      {curriculo && (
        <div className="resultado">
          <div className="resultado-header">
            <h2>Currículo Gerado</h2>
          </div>

          <div className={`curriculo-content ${isCurriculoVisible ? 'visible' : 'hidden'}`}>
             <div
               id="curriculo-pdf"
               dangerouslySetInnerHTML={{ __html: marked(curriculo) }}
             />
          </div>

          <div className="download-buttons">
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