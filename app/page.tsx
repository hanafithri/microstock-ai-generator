'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  CheckCircle, 
  RefreshCcw, 
  Settings, 
  AlertCircle,
  FileText,
  Tag,
  Briefcase,
  ClipboardPaste,
  ArrowUp,
  X,
  Plus,
  Sparkles,
  Info,
  Check,
  ShieldAlert,
  Camera,
  Paintbrush,
  Layers,
  Download,
  FileSpreadsheet,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Key,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const SHUTTERSTOCK_CATEGORIES = [
  "Abstract", "Animals/Wildlife", "Arts", "Backgrounds/Textures", "Beauty/Fashion",
  "Buildings/Landmarks", "Business/Finance", "Celebrities", "Editorial", "Education",
  "Food and Drink", "Healthcare/Medical", "Holidays", "Industrial", "Interiors",
  "Miscellaneous", "Nature", "Parks/Outdoor", "People", "Religion", "Science",
  "Signs/Symbols", "Sports/Recreation", "Technology", "Transportation", "Vintage"
];

// Fallback keywords generator to ensure minimum 40 tags guaranteed
const ensureOptimalKeywords = (extractedTags: string[] = [], mediaType = 'photo', isAiGenerated = false) => {
  const cleanTags = Array.from(
    new Set(extractedTags.map(k => k.trim().toLowerCase()))
  ).filter(Boolean);

  const pool = [
    "commercial", "background", "isolated", "design", "creative", "concept", "graphic", "modern", 
    "aesthetic", "copy space", "element", "high quality", "banner", "digital", "style", "art", 
    "illustration", "pattern", "template", "presentation", "stock asset", "advertising", "marketing", 
    "visual", "texture", "object", "contemporary", "minimalist", "clean", "render", "light", 
    "shadow", "focus", "detail", "composition", "frame", "view", "surface", "space", 
    "symbol", "idea", "image", "bright", "vibrant", "decorative", "artistic", "structure"
  ];

  if (mediaType === 'vector') {
    pool.push("vector", "eps", "scalable vector", "vector illustration", "svg", "clipart");
  } else if (mediaType === 'illustration') {
    pool.push("digital art", "drawing", "vector graphic", "artwork", "painting style");
  } else {
    pool.push("studio shot", "photography", "professional photo", "depth of field");
  }

  if (isAiGenerated) {
    pool.push("generative ai", "ai generated", "artificial intelligence", "ai art");
  }

  for (const fallbackTag of pool) {
    if (cleanTags.length >= 45) break;
    if (!cleanTags.includes(fallbackTag)) {
      cleanTags.push(fallbackTag);
    }
  }

  // Strictly clamp between 40 and 50 tags
  if (cleanTags.length > 50) {
    return cleanTags.slice(0, 50);
  }
  return cleanTags;
};

export default function App() {
  // API Key State with fallback check
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || (window as any).apiKey || '';
    }
    return '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);

  // Batch File State
  const [items, setItems] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Default SEO Settings
  const [platform, setPlatform] = useState('shutterstock'); 
  const [mediaType, setMediaType] = useState('photo'); 
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  
  // Interactive Keyword & Title Editor State
  const [keywordList, setKeywordList] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedItem = items.find(item => item.id === selectedId);

  useEffect(() => {
    if (userApiKey) {
      localStorage.setItem('gemini_api_key', userApiKey);
    }
  }, [userApiKey]);

  useEffect(() => {
    if (selectedItem && selectedItem.metadata) {
      setTitleInput(selectedItem.metadata.title || '');
      if (Array.isArray(selectedItem.metadata.keywords)) {
        setKeywordList(selectedItem.metadata.keywords);
      } else if (typeof selectedItem.metadata.keywords === 'string') {
        const tags = selectedItem.metadata.keywords.split(',').map((t: string) => t.trim()).filter(Boolean);
        setKeywordList(tags);
      }
    } else {
      setTitleInput('');
      setKeywordList([]);
    }
  }, [selectedId, items]);

  const processFiles = (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setError("Tidak ada file gambar valid yang dipilih.");
      return;
    }

    const newItems: any[] = [];
    let processedCount = 0;

    validFiles.forEach((file) => {
      if (file.size > 12 * 1024 * 1024) {
        setError("Sebagian file dilewati karena melebihi batas 12MB.");
        return;
      }

      const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        newItems.push({
          id,
          file,
          name: file.name,
          src: URL.createObjectURL(file),
          base64: base64String,
          mimeType: file.type || 'image/jpeg',
          status: 'idle', 
          error: null,
          metadata: null,
          mediaType,
          isAiGenerated
        });

        processedCount++;
        if (processedCount === validFiles.length) {
          setItems(prev => {
            const updated = [...prev, ...newItems];
            if (!selectedId && updated.length > 0) {
              setSelectedId(updated[0].id);
            }
            return updated;
          });
          setError(null);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) return;
      const filesToProcess: File[] = [];
      for (const item of Array.from(clipboardItems)) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) filesToProcess.push(blob);
        }
      }
      if (filesToProcess.length > 0) {
        processFiles(filesToProcess);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleRemoveItem = (idToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== idToRemove);
      if (selectedId === idToRemove) {
        setSelectedId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    setItems([]);
    setSelectedId(null);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitleInput(newTitle);
    if (!selectedId) return;
    setItems(prev => prev.map(item => {
      if (item.id === selectedId && item.metadata) {
        return {
          ...item,
          metadata: { ...item.metadata, title: newTitle }
        };
      }
      return item;
    }));
  };

  const handleDeleteKeyword = (indexToDelete: number) => {
    const updatedTags = keywordList.filter((_, idx) => idx !== indexToDelete);
    setKeywordList(updatedTags);
    updateItemKeywords(updatedTags);
  };

  const handleMoveToTop = (indexToMove: number) => {
    if (indexToMove === 0) return;
    const newList = [...keywordList];
    const element = newList.splice(indexToMove, 1)[0];
    newList.unshift(element);
    setKeywordList(newList);
    updateItemKeywords(newList);
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newKeywordInput.trim().toLowerCase();
    if (cleanTag && !keywordList.includes(cleanTag)) {
      if (keywordList.length >= 50) {
        setError("Batas maksimal 50 keyword telah tercapai.");
        return;
      }
      const updatedTags = [...keywordList, cleanTag];
      setKeywordList(updatedTags);
      updateItemKeywords(updatedTags);
      setNewKeywordInput('');
    }
  };

  const updateItemKeywords = (tagsArray: string[]) => {
    if (!selectedId) return;
    setItems(prev => prev.map(item => {
      if (item.id === selectedId && item.metadata) {
        return {
          ...item,
          metadata: { ...item.metadata, keywords: tagsArray }
        };
      }
      return item;
    }));
  };

  const generateMetadataSingleItem = async (itemToProcess: any) => {
    const activeKey = userApiKey || (typeof window !== 'undefined' ? (window as any).apiKey : '');
    
    if (useDemoMode || !activeKey) {
      await new Promise(r => setTimeout(r, 1000));
      const cleanName = itemToProcess.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      
      let demoTitle = "";
      if (platform === 'adobe') {
        demoTitle = `${capitalized} with clean modern composition, professional lighting, vibrant colors, and copy space for commercial presentation`;
      } else {
        demoTitle = `Detailed commercial asset featuring ${cleanName} in clean studio environment, highlighted by soft warm lighting and professional aesthetic arrangement`;
      }

      const initialDemoKeywords = [
        cleanName, `${cleanName} background`, `${cleanName} concept`, `${cleanName} design`,
        itemToProcess.mediaType, "commercial", "microstock", "stock photo", "design element", 
        "digital asset", "high resolution", "isolated", "graphic", "creative", "background", 
        "modern", "aesthetic", "concept", "art", "illustration design", "professional photo", 
        "studio shot", "copy space", "clean background", "vibrant color", "marketing asset", 
        "advertising background", "editorial", "banner", "wallpaper", "layout", "presentation", 
        "template", "style", "texture", "pattern", "surface", "object", "element", "symbol", 
        "visual", "contemporary", "minimalist", "decorative", "structure"
      ];

      const optimizedDemoKeywords = ensureOptimalKeywords(
        initialDemoKeywords, 
        itemToProcess.mediaType, 
        itemToProcess.isAiGenerated
      );

      return {
        title: demoTitle,
        description: `High resolution commercial asset illustrating ${cleanName}`,
        keywords: optimizedDemoKeywords,
        categories: platform === 'shutterstock' ? ["Backgrounds/Textures", "Abstract"] : ["Conceptual", "Graphic Design"]
      };
    }

    let mediaTypeRules = "";
    if (itemToProcess.mediaType === 'photo') {
      mediaTypeRules = `
      Media Type: PHOTO
      - SEO Focus: Use literal descriptive keywords regarding lighting, atmosphere, authentic emotions, real objects, photography styles (e.g., 'depth of field', 'studio lighting', 'daylight').
      - Keywords MUST NOT contain digital/art terms like vector, illustration, paint, graphic.
      `;
    } else if (itemToProcess.mediaType === 'illustration') {
      mediaTypeRules = `
      Media Type: ILLUSTRATION
      - SEO Focus: Describe artistic style, coloring method, thematic vibes, and usage (e.g., 'digital painting', 'graphic art', 'character design', 'artistic sketch', 'creative background').
      - Always include keywords: 'illustration', 'graphic design', 'digital art', 'creative design'.
      `;
    } else if (itemToProcess.mediaType === 'vector') {
      mediaTypeRules = `
      Media Type: VECTOR
      - SEO Focus: Prioritize buyer-intent graphic keywords matching designers' searches (e.g., 'scalable vector', 'eps 10', 'vector template', 'flat design', 'infographic element', 'clipart', 'isolated background').
      - Always include core tags: 'vector', 'scalable vector', 'eps', 'isolated on white' (if applicable), 'graphic element'.
      `;
    }

    let platformRules = "";
    if (platform === 'shutterstock') {
      platformRules = `
      Optimization Target: SHUTTERSTOCK
      - Title Length: Target 110 to 180 characters (Strict maximum: 195 characters).
      - Title Formatting: Full natural English descriptive sentence containing key search terms naturally.
      - Structure: [Primary Subject + Action/State] + [Environment/Background] + [Lighting & Color palette] + [Commercial Concept/Use-case].
      - Categories: Select exactly TWO categories from this official list ONLY: ${SHUTTERSTOCK_CATEGORIES.join(', ')}.
      `;
    } else {
      platformRules = `
      Optimization Target: ADOBE STOCK
      - Title Length: Target 90 to 170 characters (Strict maximum: 190 characters).
      - Title Formatting: Put the MAIN SUBJECT and core noun within the VERY FIRST 3-5 WORDS.
      - STRICT CRITICAL RULE FOR ADOBE: NEVER start the title with generic filler words like "A photo of", "An illustration of", "Image of", "A close up of", or "A high quality picture of".
      - Categories: Recommend two broad relevant conceptual categories.
      `;
    }

    if (itemToProcess.isAiGenerated) {
      mediaTypeRules += `
      - AI GENERATED ASSET COMPLIANCE:
        1. You MUST include tags: "Generative AI", "AI Generated", "AI Image", "Artificial Intelligence".
        2. Do NOT use terms "photorealistic", "hyperrealistic", "real", "photography", "photo" if it is a 3D/digital art style.
      `;
    }

    const systemPrompt = `You are an elite Microstock SEO & Optimization Engine specializing in title keyword density and search index ranking algorithms.
    Analyze the uploaded image and generate metadata strictly complying with microstock buyer intent and indexing rules.
    
    ${mediaTypeRules}
    ${platformRules}

    CRITICAL KEYWORD COUNT RULE:
    - You MUST generate STRICTLY BETWEEN 40 AND 50 unique keywords.
    - NEVER generate fewer than 40 keywords.
    - NEVER generate more than 50 keywords.
    - Keywords must be ordered strictly by relevance (First 5 tags = primary subject, tags 6-20 = details & background, tags 21-45 = concepts & buyer intent).
    - Keywords can be single words or standard microstock search phrases (e.g. 'copy space', 'studio shot', 'isolated on white').
    
    STRICT TITLE GENERATION FORMULA:
    1. Zero fluff, zero clickbait (e.g., no "amazing", "beautiful", "best quality").
    2. Rich with specific, searchable attributes (colors, mood, subject action, isolated vs background, orientation).
    3. Maximum length limit: STRICTLY UNDER 195 CHARACTERS.
    
    The JSON response must follow this exact structure without any extra text or markdown formatting:
    {
      "title": "A highly detailed, image-specific, SEO-friendly title targeting 110-180 characters",
      "description": "An attractive, descriptive caption of the asset",
      "keywords": ["tag1", "tag2", "tag3", ... 40 to 50 items],
      "categories": ["Category 1", "Category 2"]
    }
    
    IMPORTANT: Return only raw JSON. Do not wrap with \`\`\`json. Ensure keyword array length is between 40 and 50 items.`;

    const userPrompt = `Generate premium SEO metadata with 40-50 optimized keywords. File: ${itemToProcess.name}, Platform: ${platform.toUpperCase()}, Media: ${itemToProcess.mediaType.toUpperCase()}, AI-Generated: ${itemToProcess.isAiGenerated ? 'YES' : 'NO'}.`;

    let retries = 0;
    while (retries < 3) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: userPrompt },
                { inlineData: { mimeType: itemToProcess.mimeType || "image/jpeg", data: itemToProcess.base64 } }
              ]
            }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setShowKeyInput(true);
            throw new Error(`API Key Gemini tidak valid atau tidak memiliki akses (HTTP ${response.status}). Sila periksa API Key Anda.`);
          }
          if (response.status === 400) {
            throw new Error(`Format request atau data gambar tidak dapat diproses (HTTP 400).`);
          }
          if (response.status === 429) {
            throw new Error(`Batas kuota panggilan API terlampaui (HTTP 429). Coba beberapa saat lagi.`);
          }
          throw new Error(`Gagal menghubungi server Gemini (HTTP ${response.status}).`);
        }
        
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) throw new Error("AI tidak memberikan respon teks.");

        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        let keywordsArr = [];
        if (Array.isArray(parsed.keywords)) {
          keywordsArr = parsed.keywords;
        } else if (typeof parsed.keywords === 'string') {
          keywordsArr = parsed.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
        }

        const finalKeywords = ensureOptimalKeywords(
          keywordsArr, 
          itemToProcess.mediaType, 
          itemToProcess.isAiGenerated
        );

        return {
          ...parsed,
          keywords: finalKeywords
        };
      } catch (err: any) {
        retries++;
        if (retries === 3 || err.message.includes("API Key") || err.message.includes("400")) throw err;
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(res => setTimeout(res, delay));
      }
    }
  };

  const processBatchQueue = async () => {
    if (items.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    setError(null);

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      if (currentItem.status === 'done') continue;

      setItems(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: 'processing', error: null } : item));

      try {
        const metadataResult = await generateMetadataSingleItem(currentItem);
        
        setItems(prev => prev.map(item => {
          if (item.id === currentItem.id) {
            return {
              ...item,
              status: 'done',
              metadata: metadataResult
            };
          }
          return item;
        }));
      } catch (err: any) {
        console.error(`Error processing ${currentItem.name}:`, err);
        setItems(prev => prev.map(item => {
          if (item.id === currentItem.id) {
            return {
              ...item,
              status: 'error',
              error: err.message || "Gagal memproses gambar ini."
            };
          }
          return item;
        }));
      }
    }

    setIsProcessingBatch(false);
  };

  const downloadCSV = () => {
    const completedItems = items.filter(item => item.status === 'done' && item.metadata);
    
    if (completedItems.length === 0) {
      setError("Belum ada metadata yang selesai diproses untuk diunduh.");
      return;
    }

    const escapeCsvField = (field: any) => {
      if (field === null || field === undefined) return '""';
      const stringified = String(field);
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    let csvContent = "";

    if (platform === 'shutterstock') {
      const headers = ["Filename", "Description", "Keywords", "Categories", "Editorial", "Mature content", "illustration"];
      const rows = completedItems.map(item => {
        const meta = item.metadata;
        const keywordsStr = Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords;
        const categoriesStr = Array.isArray(meta.categories) 
          ? meta.categories.join(', ') 
          : (meta.categories || "");
        
        const isIllustration = (item.mediaType === 'illustration' || item.mediaType === 'vector') ? 'yes' : 'no';
        const isEditorial = 'no';
        const isMatureContent = 'no';

        return [
          escapeCsvField(item.name),
          escapeCsvField(meta.title || meta.description || ""),
          escapeCsvField(keywordsStr),
          escapeCsvField(categoriesStr),
          escapeCsvField(isEditorial),
          escapeCsvField(isMatureContent),
          escapeCsvField(isIllustration)
        ].join(",");
      });

      csvContent = [headers.join(","), ...rows].join("\n");
    } else {
      const headers = ["Filename", "Title", "Keywords", "Category", "Releases"];
      const rows = completedItems.map(item => {
        const meta = item.metadata;
        const keywordsStr = Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords;
        const categoryStr = Array.isArray(meta.categories) && meta.categories.length > 0 
          ? meta.categories[0] 
          : (meta.categories || "");
        const releasesStr = "";

        return [
          escapeCsvField(item.name),
          escapeCsvField(meta.title || ""),
          escapeCsvField(keywordsStr),
          escapeCsvField(categoryStr),
          escapeCsvField(releasesStr)
        ].join(",");
      });

      csvContent = [headers.join(","), ...rows].join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `metadata_${platform}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, field: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      setError("Gagal menyalin teks.");
    }
    document.body.removeChild(textArea);
  };

  const getOptimizationScore = () => {
    if (!selectedItem || !selectedItem.metadata) return null;
    let score = 100;
    const tips: string[] = [];

    const titleLength = titleInput.trim().length;
    const titleLower = titleInput.toLowerCase().trim();

    const fillerPrefixes = ['a photo of', 'an image of', 'photo of', 'image of', 'a picture of', 'picture of', 'a vector of', 'an illustration of'];
    const hasFiller = fillerPrefixes.some(prefix => titleLower.startsWith(prefix));

    if (hasFiller && platform === 'adobe') {
      score -= 15;
      tips.push("Adobe Stock SEO: Hapus awalan kata 'A photo of / An image of'. Mulai judul langsung dengan subjek utama dalam 3-5 kata pertama.");
    }

    if (titleLength < 60) {
      score -= 25;
      tips.push(`Judul terlalu pendek (${titleLength} karakter). Judul SEO mikrostock idealnya berdurasi 90 - 180 karakter.`);
    } else if (titleLength < 90) {
      score -= 10;
      tips.push("Judul cukup baik, tapi bisa ditambah detail warna atau suasana agar jangkauan SEO lebih luas.");
    } else if (titleLength > 195) {
      score -= 30;
      tips.push(`Judul melebihi batas aman (${titleLength} karakter). Potong hingga maksimal 190 karakter.`);
    }

    if (keywordList.length < 40) {
      score -= 20;
      tips.push(`Jumlah kata kunci (${keywordList.length}) masih di bawah batas minimal ideal (40 tag). Tambahkan beberapa keyword relevan.`);
    } else if (keywordList.length > 50) {
      score -= 30;
      tips.push(`Jumlah kata kunci (${keywordList.length}) melebihi batas maksimum 50 tag! Kurangi beberapa tag.`);
    }

    if (mediaType === 'vector') {
      const containsVectorKeyword = keywordList.some(k => ['vector', 'eps', 'scalable', 'svg'].includes(k.toLowerCase()));
      if (!containsVectorKeyword) {
        score -= 15;
        tips.push("Tipe Vektor terpilih tetapi tidak mendeteksi tag wajib ('vector', 'eps', 'scalable').");
      }
    }

    let grade = "Excellent (A+)";
    if (score < 60) grade = "Butuh Perbaikan (D)";
    else if (score < 80) grade = "Cukup Bagus (C)";
    else if (score < 90) grade = "Sangat Baik (B)";
    else if (score < 98) grade = "Sangat Optimal (A)";

    return { score, grade, tips, titleLength };
  };

  const optimizationData = getOptimizationScore();
  const completedCount = items.filter(i => i.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-indigo-500 to-indigo-700 p-2.5 rounded-2xl shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Microstocker AI <span className="text-xs font-semibold text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full bg-emerald-950/40">SEO BATCH v3.6</span>
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">Generator Batch Metadata & Auto CSV Export dengan Optimasi 40-50 Keyword</p>
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setUseDemoMode(!useDemoMode)}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                useDemoMode 
                  ? 'bg-amber-950/60 border-amber-600 text-amber-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Mode Simulasi/Demo Tanpa API Key"
            >
              {useDemoMode ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
              {useDemoMode ? 'Mode Demo Active' : 'Gunakan Demo Mode'}
            </button>

            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                userApiKey 
                  ? 'bg-slate-950 border-emerald-800/60 text-emerald-400' 
                  : 'bg-amber-950/40 border-amber-800 text-amber-300 animate-pulse'
              }`}
              title="Pengaturan Key API Gemini"
            >
              <Key className="w-4 h-4" />
              {userApiKey ? 'API Key Saved' : 'Atur API Key'}
            </button>

            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex shadow-inner">
              <button 
                onClick={() => setPlatform('shutterstock')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${platform === 'shutterstock' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
              >
                <span className={`w-2 h-2 rounded-full ${platform === 'shutterstock' ? 'bg-white animate-pulse' : 'bg-orange-500'}`} />
                Shutterstock
              </button>
              <button 
                onClick={() => setPlatform('adobe')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${platform === 'adobe' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
              >
                <span className={`w-2 h-2 rounded-full ${platform === 'adobe' ? 'bg-white animate-pulse' : 'bg-purple-500'}`} />
                Adobe Stock
              </button>
            </div>

            <button
              onClick={downloadCSV}
              disabled={completedCount === 0}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all border shadow-lg ${
                completedCount > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-950/40 active:scale-95' 
                  : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Unduh file .csv berformat sesuai platform"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              Download CSV ({completedCount})
            </button>
          </div>
        </header>

        {/* API Key Modal Bar */}
        {showKeyInput && (
          <div className="mb-6 p-4 bg-slate-950 border border-indigo-500/40 rounded-3xl space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-2 uppercase tracking-wider">
                <Key className="w-4 h-4" /> Masukkan Gemini API Key Anda
              </label>
              <button onClick={() => setShowKeyInput(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="password"
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={() => setShowKeyInput(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Simpan
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Dapatkan API Key gratis di Google AI Studio (aistudio.google.com). Jika tidak ada key, aktifkan <b>Mode Demo</b> untuk uji coba tanpa API Key.
            </p>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Media Options & File Upload Queue */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Media Type Controls */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Settings className="w-4 h-4 text-indigo-400" /> 1. Mode Media & Lisensi
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('photo')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    mediaType === 'photo' 
                      ? 'bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-500/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-xs font-bold">Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('illustration')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    mediaType === 'illustration' 
                      ? 'bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-500/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Paintbrush className="w-4 h-4" />
                  <span className="text-xs font-bold">Ilustrasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('vector')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    mediaType === 'vector' 
                      ? 'bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-500/10' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold">Vector</span>
                </button>
              </div>

              {/* AI Generated Toggle */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/60 hover:border-slate-700/60 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isAiGenerated ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Generative AI</p>
                    <p className="text-[10px] text-slate-500">Sisipkan tag lisensi AI otomatis</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isAiGenerated}
                  onChange={(e) => setIsAiGenerated(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500/40 bg-slate-950"
                />
              </label>
            </div>

            {/* Drag & Drop File Area */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group text-center"
            >
              <div className="w-12 h-12 bg-indigo-950/50 text-indigo-400 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all border border-indigo-900/30">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Unggah 1 atau Banyak Gambar (PNG, JPG, WebP)</h3>
              <p className="text-slate-500 text-xs mt-1">Seret file ke sini atau klik untuk memilih gambar</p>
              
              <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400 text-[11px] font-semibold mt-3">
                <ClipboardPaste className="w-3.5 h-3.5 text-indigo-400" />
                Atau Tekan <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white text-[10px]">Ctrl+V</kbd>
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                multiple
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>

            {/* Batch Processing Controls */}
            {items.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" /> Antrean File ({items.length})
                  </span>
                  <button 
                    onClick={handleClearAll}
                    className="text-slate-500 hover:text-rose-400 text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                  </button>
                </div>

                <button
                  disabled={isProcessingBatch}
                  onClick={processBatchQueue}
                  className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl ${
                    isProcessingBatch 
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98]'
                  }`}
                >
                  {isProcessingBatch ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin text-white" />
                      Memproses Metadata Batch (40-50 Keyword)...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Proses Semua Gambar ({items.filter(i => i.status !== 'done').length})
                    </>
                  )}
                </button>
              </div>
            )}

            {/* File List */}
            {items.length > 0 && (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/20' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <img src={item.src} alt={item.name} className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-800" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.status === 'idle' && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" /> Menunggu
                              </span>
                            )}
                            {item.status === 'processing' && (
                              <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold animate-pulse">
                                <RefreshCcw className="w-3 h-3 animate-spin" /> Menganalisis...
                              </span>
                            )}
                            {item.status === 'done' && (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Selesai ({item.metadata?.keywords?.length || 0} tag)
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold truncate max-w-[180px]">
                                <AlertCircle className="w-3 h-3 shrink-0" /> {item.error}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors ml-2 shrink-0"
                        title="Hapus dari antrean"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {error && (
              <div className="bg-rose-950/40 border border-rose-800/60 text-rose-300 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <p className="text-xs font-medium">{error}</p>
              </div>
            )}
          </section>

          {/* Right Column: Editor & Preview */}
          <section className="lg:col-span-7 space-y-6">
            
            {items.length === 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-12 text-center h-[520px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-900 text-slate-600 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-slate-300 font-bold text-base">Unggah Gambar Untuk Memulai Batch</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 leading-relaxed">
                  Unggah satu atau banyak file sekaligus, klik tombol proses, lalu unduh hasilnya langsung dalam format file `.csv` dengan 40-50 keyword teroptimasi per gambar.
                </p>
              </div>
            )}

            {selectedItem && selectedItem.status === 'idle' && (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-10 text-center h-[520px] flex flex-col items-center justify-center space-y-4">
                <img src={selectedItem.src} alt="Preview" className="w-40 h-40 object-contain rounded-2xl border border-slate-800 bg-slate-900 p-2" />
                <div>
                  <h3 className="text-slate-200 font-bold text-sm">{selectedItem.name}</h3>
                  <p className="text-slate-500 text-xs mt-1">Gambar ini berada dalam antrean. Klik "Proses Semua Gambar" untuk menghasilkan 40-50 keyword.</p>
                </div>
              </div>
            )}

            {selectedItem && selectedItem.status === 'processing' && (
              <div className="space-y-6 bg-slate-950/20 p-6 rounded-3xl border border-slate-800 animate-pulse">
                <div className="h-6 w-1/4 bg-slate-800 rounded-lg"></div>
                <div className="h-16 bg-slate-800 rounded-2xl"></div>
                <div className="h-20 bg-slate-800 rounded-2xl"></div>
                <div className="h-40 bg-slate-800 rounded-2xl"></div>
              </div>
            )}

            {selectedItem && selectedItem.status === 'done' && selectedItem.metadata && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* Selected Item Banner */}
                <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${platform === 'shutterstock' ? 'bg-orange-950/20 border-orange-800/30' : 'bg-purple-950/20 border-purple-800/30'}`}>
                  <div className="flex items-center gap-3">
                    <img src={selectedItem.src} alt={selectedItem.name} className="w-12 h-12 object-cover rounded-xl border border-slate-800" />
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs truncate max-w-[240px]">{selectedItem.name}</h4>
                      <p className="text-[10px] text-slate-400">Target SEO: {platform === 'shutterstock' ? 'Shutterstock' : 'Adobe Stock'} ({mediaType.toUpperCase()})</p>
                    </div>
                  </div>
                  
                  {optimizationData && (
                    <div className="text-right flex items-center sm:block gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 block sm:mb-1">Metascore SEO:</span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${optimizationData.score >= 90 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' : 'bg-amber-950 text-amber-400 border border-amber-800/30'}`}>
                        {optimizationData.grade} ({optimizationData.score}/100)
                      </span>
                    </div>
                  )}
                </div>

                {/* Optimization Tips */}
                {optimizationData && optimizationData.tips.length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-2xl space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4" /> Rekomendasi SEO & Kepatuhan:
                    </p>
                    <ul className="list-disc pl-5 text-[11px] text-slate-300 space-y-1">
                      {optimizationData.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Title Editor */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800/80 shadow-sm relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" /> Judul Teroptimasi SEO ({titleInput.length} karakter)
                      </label>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {platform === 'adobe' 
                          ? "💡 Adobe Stock: Subjek utama WAJIB berada di 3-5 kata pertama." 
                          : "💡 Shutterstock: Buat kalimat deskriptif panjang (110-180 karakter)."}
                      </span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(titleInput, 'title')}
                      className={`px-3 py-1 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border ${copiedField === 'title' ? 'bg-emerald-950 text-emerald-400 border-emerald-800/30' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'}`}
                    >
                      {copiedField === 'title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'title' ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>

                  <input 
                    type="text" 
                    value={titleInput}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-slate-200 font-semibold text-sm focus:outline-none transition-colors ${
                      titleInput.length > 195 || titleInput.length < 60 
                        ? 'border-amber-500/60 focus:border-amber-500' 
                        : 'border-slate-800 focus:border-indigo-500/60'
                    }`}
                    placeholder="Masukkan judul microstock"
                  />
                  
                  {/* Title Length Indicator Progress Bar */}
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          titleInput.length > 195 
                            ? 'bg-rose-500' 
                            : titleInput.length >= 90 && titleInput.length <= 180 
                            ? 'bg-emerald-500' 
                            : titleInput.length >= 60 
                            ? 'bg-amber-400' 
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, (titleInput.length / 200) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${
                      titleInput.length > 195 ? 'text-rose-400 font-bold' : titleInput.length >= 90 ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                    }`}>
                      {titleInput.length}/200 karakter
                    </span>
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800/80 shadow-sm">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                    Kategori Relevan {platform === 'shutterstock' ? '(Official Shutterstock)' : '(Kategori Konseptual)'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.metadata.categories?.map((cat: string, idx: number) => (
                      <span 
                        key={idx} 
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${platform === 'shutterstock' ? 'bg-orange-950/30 text-orange-400 border-orange-900/30' : 'bg-purple-950/30 text-purple-400 border-purple-900/30'}`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords Editor */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800/80 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-400" /> Kata Kunci ({keywordList.length})
                        </label>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          keywordList.length >= 40 && keywordList.length <= 50 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' 
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/50'
                        }`}>
                          Target Ideal: 40–50 Tag
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {platform === 'adobe' 
                          ? "💡 Adobe Stock: 5 tag pertama di-index paling tinggi. Gunakan tombol ⬆️ untuk menempatkan tag terpenting!" 
                          : "💡 Shutterstock mengizinkan hingga maksimal 50 kata kunci."}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => copyToClipboard(keywordList.join(', '), 'keywords')}
                      className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border self-start ${copiedField === 'keywords' ? 'bg-emerald-950 text-emerald-400 border-emerald-800/30' : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500/20'}`}
                    >
                      {copiedField === 'keywords' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'keywords' ? 'Tersalin' : 'Salin Tag (CSV)'}
                    </button>
                  </div>

                  <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Tambah kata kunci kustom..." 
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500/50 text-slate-200"
                    />
                    <button 
                      type="submit"
                      disabled={keywordList.length >= 50}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Tambah
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar p-1">
                    {keywordList.map((tag, idx) => {
                      const isPriority = platform === 'adobe' && idx < 5;
                      return (
                        <span 
                          key={idx} 
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border ${isPriority ? 'bg-indigo-950 text-indigo-300 border-indigo-700/60 font-bold shadow-sm shadow-indigo-950/50 ring-1 ring-indigo-500/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'}`}
                        >
                          <span className="text-[10px] text-slate-600 font-mono">{idx + 1}.</span>
                          {isPriority && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" title="Top Priority Tag" />
                          )}
                          
                          <span>{tag}</span>
                          
                          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-800">
                            {idx > 0 && (
                              <button 
                                onClick={() => handleMoveToTop(idx)} 
                                className="hover:text-indigo-400 transition-colors text-slate-500"
                                title="Naikkan ke prioritas utama"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteKeyword(idx)} 
                              className="hover:text-rose-400 transition-colors text-slate-500"
                              title="Hapus kata kunci"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Export CTA */}
                <div className="bg-emerald-950/20 border border-emerald-800/30 p-5 rounded-3xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-950 p-2.5 rounded-2xl border border-emerald-800/40 text-emerald-400">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">Ekspor Siap Upload ({platform.toUpperCase()})</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">Unduh berkas .CSV dengan seluruh data ({completedCount} item selesai) untuk diunggah langsung di panel kontributor.</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shrink-0 transition-all shadow-lg shadow-emerald-950/50"
                  >
                    Unduh .CSV
                  </button>
                </div>

              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
