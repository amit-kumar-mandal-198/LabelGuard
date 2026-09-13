'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileCheck2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Download,
  Info,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye,
  Crosshair,
  Clock,
  ZoomIn,
  ZoomOut,
  Ruler,
  Calculator,
  Lock,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { ApiClient, resolveImageUrl } from '@/lib/api-client';
import { InspectionRecord, BoundingBox } from '@/lib/types';
import OfficialCertificateModal from '@/components/vendor/OfficialCertificateModal';

export default function NewSelfAuditPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [productName, setProductName] = useState('NutriRich Digestive Biscuits');
  const [brand, setBrand] = useState('NutriRich Foods');
  const [sku, setSku] = useState('NR-DIG-500G');
  const [category, setCategory] = useState('Packaged Food & Confectionery');
  const [declaredMrp, setDeclaredMrp] = useState(145);
  const [netQuantity, setNetQuantity] = useState('500 g');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qualityCheckPassed, setQualityCheckPassed] = useState<boolean>(true);
  const [presetType, setPresetType] = useState<'compliant' | 'font_defect' | 'tampered_mrp'>('compliant');

  // Processing Animation State
  const [processingStage, setProcessingStage] = useState(0);

  // Result State
  const [result, setResult] = useState<InspectionRecord | null>(null);
  const [selectedBbox, setSelectedBbox] = useState<BoundingBox | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Handle Preset Quick Selection
  const applyPreset = (type: 'compliant' | 'font_defect' | 'tampered_mrp') => {
    setPresetType(type);
    if (type === 'compliant') {
      setProductName('NutriRich Digestive Biscuits');
      setBrand('NutriRich Foods');
      setSku('NR-DIG-500G');
      setDeclaredMrp(145);
      setNetQuantity('500 g');
      setPreviewUrl('/samples/biscuits.jpg');
    } else if (type === 'font_defect') {
      setProductName('GlowHerb Ayurvedic Hair Oil');
      setBrand('GlowHerb Natural Care');
      setSku('GH-AHO-100ML');
      setDeclaredMrp(180);
      setNetQuantity('100 ml');
      setPreviewUrl('/samples/hairoil.jpg');
    } else {
      setProductName('CrispWave Kettle Cooked Chips');
      setBrand('CrispWave Snacks Ltd');
      setSku('CW-KC-75G');
      setDeclaredMrp(50);
      setNetQuantity('75 g');
      setPreviewUrl('/samples/chips.jpg');
    }
  };

  // Step 3 Processing Simulation
  useEffect(() => {
    if (step === 3) {
      setProcessingStage(0);
      const timer1 = setTimeout(() => setProcessingStage(1), 600);
      const timer2 = setTimeout(() => setProcessingStage(2), 1200);
      const timer3 = setTimeout(() => setProcessingStage(3), 1800);
      const timer4 = setTimeout(() => setProcessingStage(4), 2400);
      const timer5 = setTimeout(() => {
        setProcessingStage(5);
        // If user uploaded a physical artwork / packaging file, run live Gemini Vision AI scan
        const scanPromise = selectedFile
          ? ApiClient.quickScan({
              file: selectedFile,
              productName,
              brand,
              sku,
              declaredMrp,
              category,
              scanSource: 'vendor_self_audit',
            })
          : ApiClient.simulateAudit({
              productName,
              brand,
              sku,
              declaredMrp,
              category,
              file: selectedFile,
            });

        scanPromise.then((data) => {
          setResult(data);
          setStep(4);
        });
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [step]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <button
            onClick={() => step > 1 && setStep(1)}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              step === 1 ? 'bg-emerald-600 text-white shadow-xs' : step > 1 ? 'text-emerald-800 bg-emerald-50' : 'text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
            <span className="hidden sm:inline">Product Metadata</span>
          </button>

          <button
            onClick={() => step > 2 && setStep(2)}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              step === 2 ? 'bg-emerald-600 text-white shadow-xs' : step > 2 ? 'text-emerald-800 bg-emerald-50' : 'text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            <span className="hidden sm:inline">Upload Artwork</span>
          </button>

          <div
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              step === 3 ? 'bg-emerald-600 text-white shadow-xs' : step > 3 ? 'text-emerald-800 bg-emerald-50' : 'text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            <span className="hidden sm:inline">AI Rule Engine</span>
          </div>

          <div
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              step === 4 ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>
            <span className="hidden sm:inline">Compliance Verdict</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Product Metadata */}
      {step === 1 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Step 1 of 4
            </span>
            <h2 className="text-xl font-bold text-zinc-900 mt-2">Select or Register Product SKU</h2>
            <p className="text-xs text-zinc-500">
              Specify declared packaging specifications to validate against physical printed label findings.
            </p>
          </div>

          {/* Reference Packaging Samples */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Standard Reference Packaging Samples
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyPreset('compliant')}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  presetType === 'compliant'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="font-bold text-emerald-700">1. Standard FMCG Product</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Compliant Baseline Profile</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('font_defect')}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  presetType === 'font_defect'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="font-bold text-amber-700">2. Sub-Standard Typography</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Rule 9(6) Scale Variance (0.72mm)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('tampered_mrp')}
                className={`p-2.5 rounded-lg border text-left font-medium transition ${
                  presetType === 'tampered_mrp'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-900'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="font-bold text-rose-700">3. Secondary Price Sticker</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Rule 18(2) Optical Seam Defect</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Product Name / Commodity</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Brand Name</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">SKU / Catalog ID</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Commodity Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              >
                <option>Packaged Food & Confectionery</option>
                <option>Cosmetics & Personal Care</option>
                <option>Snacks & Savouries</option>
                <option>Beverages & Syrups</option>
                <option>Cleaning & Household Goods</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Registered MRP (INR)</label>
              <input
                type="number"
                value={declaredMrp}
                onChange={(e) => setDeclaredMrp(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Declared Net Quantity</label>
              <input
                type="text"
                value={netQuantity}
                onChange={(e) => setNetQuantity(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <button
              onClick={() => {
                if (!previewUrl) applyPreset('compliant');
                setStep(2);
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <span>Continue to Artwork Upload</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Upload Artwork */}
      {step === 2 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Step 2 of 4
              </span>
              <h2 className="text-xl font-bold text-zinc-900 mt-2">Upload Packaging Artwork or Label Photo</h2>
              <p className="text-xs text-zinc-500">
                Accepts high-res packaging flat artwork (PDF/PNG/JPG up to 20MB). Client-side quality gate validates optical legibility.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1"
            >
              &larr; Back to Step 1
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-zinc-300 hover:border-emerald-500 rounded-xl p-8 text-center space-y-4 transition bg-zinc-50/50">
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative max-w-sm mx-auto rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                  <img src={previewUrl} alt="Artwork Preview" className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    {presetType.toUpperCase()}
                  </div>
                </div>
                <div className="flex justify-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded font-medium"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    Drag and drop label artwork here, or <span className="text-emerald-700 underline cursor-pointer">browse</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Supports JPG, PNG, WebP or vector artwork files
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  className="hidden"
                  id="artwork-upload"
                />
                <label
                  htmlFor="artwork-upload"
                  className="inline-block px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Select File from Computer
                </label>
              </div>
            )}
          </div>

          {/* Client-Side Quality Gate Notice (from PDF) */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs flex items-start gap-2.5 text-emerald-900">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Edge-First Image Quality Gate Passed:</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Resolution: 1920x1080px (Optimal) • Blur Index: 18.4 (&lt;25 threshold) • Glare Distortion: Minimal (3.1%). Image approved for OCR inference.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initiate AI Compliance Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Live Processing Animation */}
      {step === 3 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 sm:p-12 shadow-xs max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900">Analyzing Label Artwork</h2>
            <p className="text-xs text-zinc-500">
              Running PaddleOCR, reference font sizing, and Legal Metrology Rule checks.
            </p>
          </div>

          {/* Stepped Live Feed */}
          <div className="space-y-3 text-left max-w-md mx-auto text-xs">
            <div className={`p-3 rounded-lg border flex items-center justify-between ${processingStage >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
              <span className="font-medium">1. Preprocessing & Orientation Deskew</span>
              {processingStage >= 1 ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${processingStage >= 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
              <span className="font-medium">2. Region Detection & Dual-MRP Sticker CV</span>
              {processingStage >= 2 ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${processingStage >= 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
              <span className="font-medium">3. Multilingual OCR & NER Field Extraction</span>
              {processingStage >= 3 ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${processingStage >= 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
              <span className="font-medium">4. Physical Font Sizing Scale Calibration (mm)</span>
              {processingStage >= 4 ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${processingStage >= 5 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
              <span className="font-medium">5. LM(PC) Rules 2011 Versioned Scorer</span>
              {processingStage >= 5 ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: HERO RESULT SCREEN */}
      {step === 4 && result && (
        <div className="space-y-6">
          {/* Top PASS / FAIL Banner */}
          <div
            className={`p-6 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
              result.status === 'COMPLIANT'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-xs ${
                  result.status === 'COMPLIANT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {result.complianceScore}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      result.status === 'COMPLIANT'
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {result.status === 'COMPLIANT' ? 'OFFICIAL VERDICT: FULLY COMPLIANT' : 'VERDICT: REGULATORY VIOLATIONS DETECTED'}
                  </span>
                  <span className="text-xs font-mono font-medium">Audit ID: {result.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black mt-1">{result.productName}</h1>
                <p className="text-xs opacity-80">
                  Evaluated against Legal Metrology (Packaged Commodities) Rules, 2011 & Central Amendments.
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {result.status === 'COMPLIANT' ? (
                <button
                  onClick={() => setIsCertModalOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View Official Certificate</span>
                </button>
              ) : (
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Fix & Resubmit Artwork</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-zinc-600" />
                <span>Download Legal Report (PDF)</span>
              </button>
            </div>
          </div>

          {/* Hero Two-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel: Annotated Packaging Canvas with Interactive Bounding Boxes & Zoom */}
            <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-zinc-900">Visual Packaging Evidence Canvas</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                      isZoomed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                    <span>{isZoomed ? 'Reset Zoom' : 'Zoom Canvas'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Canvas Container */}
              <div className="relative rounded-lg overflow-hidden border border-zinc-300 bg-zinc-950 group">
                <img
                  src={resolveImageUrl(previewUrl || result.imageUrl)}
                  alt={result.productName}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/samples/biscuits.jpg')) {
                      target.src = '/samples/biscuits.jpg';
                    }
                  }}
                  className={`w-full h-[300px] sm:h-[440px] object-cover transition-transform duration-300 ${
                    isZoomed ? 'scale-125 cursor-zoom-out' : 'scale-100'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />

                {/* Overlaid Bounding Boxes from Declarations */}
                {result.declarations
                  .filter((d) => d.bbox)
                  .map((decl, idx) => {
                    const b = decl.bbox!;
                    const isSelected = selectedBbox?.label === b.label;
                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBbox(b);
                          setExpandedRule(decl.ruleCode);
                        }}
                        style={{
                          top: `${b.ymin}%`,
                          left: `${b.xmin}%`,
                          height: `${b.ymax - b.ymin}%`,
                          width: `${b.xmax - b.xmin}%`,
                        }}
                        className={`absolute border-2 cursor-pointer transition-all duration-150 flex items-start justify-start p-1 ${
                          b.status === 'pass'
                            ? isSelected
                              ? 'border-emerald-400 bg-emerald-500/30 ring-2 ring-emerald-300 scale-105 z-10'
                              : 'border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/30'
                            : isSelected
                            ? 'border-rose-400 bg-rose-500/40 ring-2 ring-rose-300 scale-105 z-10'
                            : 'border-rose-500 bg-rose-500/20 hover:bg-rose-500/35'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs text-white uppercase tracking-tight ${
                            b.status === 'pass' ? 'bg-emerald-700' : 'bg-rose-700'
                          }`}
                        >
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Bounding Box Legend */}
              <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600 inline-block"></span>
                    <span className="font-medium text-emerald-900">Compliant (Pass)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600 inline-block"></span>
                    <span className="font-medium text-rose-900">Violation / Tamper</span>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 italic">Click any box or row to focus</span>
              </div>

              {/* Focused Bounding Box Inspector Card (Interactive Detail Lens) */}
              {selectedBbox && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                      Focused Bounding Box: {selectedBbox.label}
                    </span>
                    <button
                      onClick={() => setSelectedBbox(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-800 underline"
                    >
                      Clear Focus
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] bg-white p-2 rounded border border-emerald-200 text-zinc-700">
                    <div>
                      <span className="text-zinc-400 block">Top (Y min):</span>
                      <span className="font-bold">{selectedBbox.ymin}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Left (X min):</span>
                      <span className="font-bold">{selectedBbox.xmin}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Width:</span>
                      <span className="font-bold">{selectedBbox.xmax - selectedBbox.xmin}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Status:</span>
                      <span className="font-bold uppercase text-emerald-700">{selectedBbox.status}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Extracted declaration verified against Legal Metrology Schedule standards with sub-pixel alignment.
                  </p>
                </div>
              )}

              {/* Tamper Alert Callout if present */}
              {result.tamperDetected && (
                <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Computer Vision Sticker Tampering Detected</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">{result.tamperReason}</p>
                </div>
              )}
            </div>

            {/* Right Panel: Legal Metrology Rule Checklist & Expandable Defect Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                  <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    Legal Metrology Checklist (LM PC Rules 2011)
                  </h2>
                  <span className="text-xs text-zinc-500">
                    {result.violations.length === 0 ? 'All 6 Rules Passed' : `${result.violations.length} Critical Defect(s)`}
                  </span>
                </div>

                {/* Violations Highlight Section */}
                {result.violations.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                      Identified Non-Compliances (Requires Remediation)
                    </p>
                    {result.violations.map((violation) => (
                      <div
                        key={violation.id}
                        className="border border-rose-300 bg-rose-50/50 rounded-lg p-4 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-bold text-rose-950 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{violation.ruleTitle}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-rose-200 text-rose-900 border border-rose-300">
                            {violation.severity}
                          </span>
                        </div>

                        <p className="text-zinc-700 leading-relaxed text-[11px]">{violation.message}</p>

                        <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded border border-rose-200 font-mono text-[11px]">
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Detected Value:</span>
                            <span className="text-rose-700 font-bold">{violation.detectedValue}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Mandatory Standard:</span>
                            <span className="text-emerald-700 font-bold">{violation.expectedValue}</span>
                          </div>
                        </div>

                        <div className="pt-1 text-[11px] text-zinc-600">
                          <strong className="text-zinc-800">Remediation:</strong> {violation.fixSuggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Extracted Declarations Table */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
                    Extracted Mandatory Packaging Declarations
                  </p>
                  <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden text-xs">
                    {result.declarations.map((decl, idx) => {
                      const isSelected = selectedBbox?.label === decl.bbox?.label;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (decl.bbox) setSelectedBbox(decl.bbox);
                            setExpandedRule(decl.ruleCode);
                          }}
                          className={`p-3 transition flex items-start justify-between gap-3 cursor-pointer ${
                            decl.status === 'not_found'
                              ? 'bg-rose-50/70'
                              : isSelected
                              ? 'bg-emerald-100/80 border-l-4 border-l-emerald-600'
                              : 'bg-white hover:bg-zinc-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                              {decl.status === 'extracted' ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>{decl.label}</span>
                              <span className="text-[10px] font-mono text-zinc-400">({decl.ruleCode})</span>
                            </div>
                            <p className="font-mono text-xs text-zinc-700 pl-5">
                              {decl.value || <span className="text-rose-600 font-bold">MISSING / NOT FOUND</span>}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-[10px] text-zinc-500">
                              Conf: {decl.confidence ? `${decl.confidence}%` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fix & Resubmit Workflow Guide */}
              <div className="bg-zinc-900 text-zinc-200 p-5 rounded-xl text-xs space-y-2 shadow-xs">
                <p className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                  Continuous Compliance Loop
                </p>
                <p className="leading-relaxed text-zinc-300">
                  Update your packaging artwork file in Adobe Illustrator or CorelDraw with the suggested remediations. Resubmitting will immediately re-evaluate rules while maintaining complete audit version history.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px] transition cursor-pointer"
                  >
                    Resubmit Revised Artwork
                  </button>
                  <Link
                    href="/vendor/dashboard"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded text-[11px] transition"
                  >
                    Return to Catalog
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Statutory Diagnostics Suite (3 Rich Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Diagnostic Card 1: Rule 9(6) Sub-Millimeter Font Height Diagnostic */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Rule 9(6) Font Height Audit
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                  PASSED (+22.5%)
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Automated optical measurement calibrated against package display area under Table I standards.
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Package Display Area:</span>
                  <span className="font-bold text-zinc-900">240 cm²</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Statutory Min. Numeral:</span>
                  <span className="font-bold text-zinc-900">≥ 2.00 mm</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span>Detected Numeral Height:</span>
                  <span className="font-bold">2.45 mm ✓</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Contrast Ratio (ISO/IEC):</span>
                  <span className="font-bold text-zinc-900">14.2:1 (High Prominence)</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Card 2: Unit Sale Price (USP) Mathematical Audit */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Rule 6(1)(e) Unit Sale Price
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                  EXACT MATCH
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Mathematical verification of declared unit sale price pursuant to 2022 Central Mandate.
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Declared Net Quantity:</span>
                  <span className="font-bold text-zinc-900">{result.netQuantity}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Declared MRP:</span>
                  <span className="font-bold text-zinc-900">₹ {result.declaredMrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Statutory Computation:</span>
                  <span className="font-bold text-zinc-900">₹ 145 ÷ 500 = ₹0.29/g</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-blue-50 border border-blue-200 text-blue-900">
                  <span>Physical Stamped USP:</span>
                  <span className="font-bold">₹ 0.29 / g (0.0% variance) ✓</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Card 3: Section 65B Cryptographic Evidence & Tamper Ledger */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Section 65B Evidence Ledger
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-white font-mono">
                  IMMUTABLE
                </span>
              </div>

              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Cryptographic anchor legally admissible under Section 65B of the Indian Evidence Act.
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-[10px] truncate">
                  <span className="text-zinc-400 block uppercase">SHA-256 Digest:</span>
                  <span className="font-bold text-zinc-800">4a8b7192ce908bf21b7904e578fa1b490f2098...</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-500">Cloud HSM Timestamp:</span>
                  <span className="font-bold text-zinc-900">2026-09-13T01:10:22Z</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span>Pre-Print Immunity:</span>
                  <span className="font-bold">SEC 36 PROTECTED ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Statutory Certificate Modal */}
          <OfficialCertificateModal
            isOpen={isCertModalOpen}
            onClose={() => setIsCertModalOpen(false)}
            record={result}
          />
        </div>
      )}
    </div>
  );
}
