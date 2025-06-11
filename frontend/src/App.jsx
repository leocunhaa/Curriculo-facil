import { useState } from 'react'
import '../src/styles.css'

function App() {
  const [formData, setFormData] = useState({ nome: '', cargo: '', experiencias: '', habilidades: '', formacao: '', idiomas: '' });
  const [curriculo, setCurriculo] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="container">
      <h1>Currículo Inteligente</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="nome" placeholder="Nome (opcional)" onChange={handleChange} />
        <input type="text" name="cargo" placeholder="Cargo desejado" onChange={handleChange} required />
        <textarea name="experiencias" placeholder="Experiências" onChange={handleChange} required />
        <textarea name="habilidades" placeholder="Habilidades" onChange={handleChange} required />
        <textarea name="formacao" placeholder="Formação acadêmica" onChange={handleChange} required />
        <textarea name="idiomas" placeholder="Idiomas" onChange={handleChange} required />
        <button type="submit">{loading ? 'Gerando...' : 'Gerar Currículo com IA'}</button>
      </form>
      {curriculo && (
        <div className="resultado">
          <h2>Currículo Gerado</h2>
          <pre>{curriculo}</pre>
          <button onClick={copyToClipboard}>Copiar texto</button>
          <button onClick={downloadTxt}>Baixar como .txt</button>
        </div>
      )}
    </div>
  );
}

export default App;