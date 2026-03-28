'use client';

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { FileText, Loader2, Play, ShieldAlert, TrendingUp, Zap, UploadCloud, X, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_PROMPT = `Você é um Consultor de Eficiência Operacional e CFO experiente. Sua análise não é jurídica, é FINANCEIRA e ESTRATÉGICA.

Analise o contrato fornecido e gere um relatório técnico-estratégico com a seguinte estrutura:

1. RESUMO EXECUTIVO: Partes, Objeto, Valor Total Estimado e Vigência.
2. ANÁLISE SWOT DO CONTRATO: Pontos Fortes (proteção), Pontos Fracos (exposição), Oportunidades (renegociação) e Ameaças (riscos de multa).
3. RADAR DE ATENÇÃO: Cláusulas críticas de rescisão e reajuste automático.
4. INSIGHTS "OUT OF THE BOX" (Obrigatório): 
   - Analise a operação descrita. 
   - Questione: "Este serviço precisa ser externo?", "Existe sobreposição de funções?", "O modelo de cobrança (ex: fee fixo vs sucess) é o melhor?".
   - Sugira substituições tecnológicas ou mudanças de processos para reduzir o custo em pelo menos 15%.

REGRAS DE ESCRITA:
- Use linguagem corporativa de alto nível.
- Seja audacioso nas sugestões de economia (Ex: sugerir automação de uma tarefa humana descrita no contrato).
- Se o contrato for de TI, analise redundância de software. Se for Facilities, analise escala de trabalho.

Retorne o resultado estritamente em Markdown. Não inclua nenhuma saudação ou texto fora do formato Markdown solicitado.`;

export default function ContractAnalyzer() {
  const [contractText, setContractText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{ mimeType: string, data: string } | null>(null);
  const [report, setReport] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const processFile = (file: File) => {
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Formato não suportado. Por favor, envie um arquivo PDF, DOCX ou TXT.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo é muito grande. O tamanho máximo permitido é 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setFileData({
        mimeType: file.type,
        data: base64String
      });
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo. Tente novamente.');
      setSelectedFile(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // Reset input
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileData(null);
  };

  const handleAnalyze = async () => {
    if (!contractText.trim() && !fileData) {
      setError('Por favor, insira o texto do contrato ou faça upload de um arquivo.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setReport('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const parts: any[] = [];
      
      if (fileData) {
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        });
      }
      
      if (contractText.trim()) {
        parts.push({ text: contractText });
      } else if (fileData) {
        parts.push({ text: "Analise o contrato em anexo seguindo as instruções do sistema." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.2, // Low temperature for more analytical/consistent output
        }
      });

      if (response.text) {
        setReport(response.text);
      } else {
        setError('Não foi possível gerar o relatório. Tente novamente.');
      }
    } catch (err) {
      console.error('Error analyzing contract:', err);
      setError('Ocorreu um erro ao comunicar com a IA. Verifique se o formato do arquivo é suportado e tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Panel: Input */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col border-r border-slate-200 bg-white shadow-sm z-10 h-screen overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Zap size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Contract Analyzer Pro
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Análise Financeira e Estratégica de Contratos (Visão CFO)
          </p>
        </div>

        <div className="flex-grow flex flex-col gap-5">
          
          {/* File Upload Area */}
          {!selectedFile ? (
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-indigo-300 transition-all relative group"
            >
              <input 
                type="file" 
                accept=".pdf,.docx,.txt" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud size={24} className="text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700 text-center">Arraste seu contrato ou clique para upload</p>
              <p className="text-xs text-slate-400 mt-1">Suporta PDF, DOCX e TXT (Max 10MB)</p>
            </div>
          ) : (
            <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                  <FileIcon size={20} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={removeFile} 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Remover arquivo"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 py-1">
            <div className="h-px bg-slate-200 flex-grow"></div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">OU</span>
            <div className="h-px bg-slate-200 flex-grow"></div>
          </div>

          {/* Text Area */}
          <div className="flex flex-col flex-grow gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="contract-input" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText size={16} />
                Colar Texto do Contrato
              </label>
              <button
                onClick={() => setContractText("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE LIMPEZA E CONSERVAÇÃO\n\nCONTRATANTE: Empresa Fictícia S.A.\nCONTRATADA: Limpeza Total Ltda.\n\nOBJETO: Prestação de serviços de limpeza, conservação e higienização nas dependências da CONTRATANTE.\n\nVALOR: R$ 50.000,00 (cinquenta mil reais) mensais.\n\nVIGÊNCIA: 12 (doze) meses, renováveis automaticamente por iguais períodos, salvo manifestação em contrário com 30 dias de antecedência.\n\nREAJUSTE: Anual, pelo IGPM.\n\nRESCISÃO: Multa de 3 (três) mensalidades em caso de rescisão imotivada antes do término da vigência.\n\nOBRIGAÇÕES DA CONTRATADA: Fornecer 10 (dez) funcionários em horário comercial (8h às 18h), uniformizados e com EPIs. Fornecer todos os materiais e equipamentos de limpeza.")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Carregar Exemplo
              </button>
            </div>
            <textarea
              id="contract-input"
              className="flex-grow w-full min-h-[200px] p-4 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none font-mono text-sm leading-relaxed"
              placeholder="Cole o conteúdo do contrato aqui se preferir não fazer upload..."
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
            />
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100"
              >
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!contractText.trim() && !fileData)}
            className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md mt-2 shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analisando Estratégia...
              </>
            ) : (
              <>
                <Play size={20} />
                Gerar Relatório Estratégico
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-full md:w-1/2 p-6 md:p-10 bg-slate-50 overflow-y-auto h-screen">
        {report ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Relatório de Eficiência</h2>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Gerado por IA (Visão CFO)</p>
              </div>
            </div>
            
            <div className="prose prose-slate prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-indigo-600 max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
              <FileText size={40} className="text-slate-300" />
            </div>
            <p className="text-center max-w-sm">
              O relatório estratégico aparecerá aqui após a análise do contrato.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
