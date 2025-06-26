"use client";

import { useState, useRef, ChangeEvent } from 'react';
import {
  BrainCircuit,
  FileText,
  Loader2,
  Mic,
  RefreshCw,
  Search,
  Square,
  Upload,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateGraphNetwork } from '@/ai/flows/generate-graph-network';
import { queryDataWithLLM } from '@/ai/flows/query-data-with-llm';
import { summarizeUploadedData } from '@/ai/flows/summarize-uploaded-data';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';

type LoadingStates = {
  isGeneratingGraph: boolean;
  isSummarizing: boolean;
  isQuerying: boolean;
  isTranscribing: boolean;
};

export default function VisAigePage() {
  const { toast } = useToast();
  const [data, setData] = useState('');
  const [model, setModel] = useState<'GPT' | 'LLaMA' | 'DeepSeek'>('GPT');
  const [summary, setSummary] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [graphImage, setGraphImage] = useState('');
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState<LoadingStates>({
    isGeneratingGraph: false,
    isSummarizing: false,
    isQuerying: false,
    isTranscribing: false,
  });
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setData(text);
        toast({
          title: "File Loaded",
          description: `${file.name} has been loaded successfully.`,
        });
      };
      reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Error",
            description: "There was an error reading the file.",
        });
      }
      reader.readAsText(file);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        if (!navigator.mediaDevices?.getUserMedia) {
            toast({ variant: "destructive", title: "Audio Recording Not Supported", description: "Your browser does not support this feature." });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            const audioChunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                if (audioChunks.length === 0) {
                    toast({ variant: "destructive", title: "No Audio Recorded", description: "No audio was captured. Please try again." });
                    return;
                }
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Data = reader.result as string;
                    setLoading(prev => ({ ...prev, isTranscribing: true }));
                    try {
                        const result = await transcribeAudio({ audioDataUri: base64Data });
                        setData(result.transcript);
                        toast({ title: "Audio Transcribed", description: "Your audio has been converted to text." });
                    } catch (error) {
                        console.error(error);
                        toast({ variant: "destructive", title: "Error Transcribing", description: "Could not transcribe audio." });
                    } finally {
                        setLoading(prev => ({ ...prev, isTranscribing: false }));
                    }
                };
            };
            
            recorder.start();
            setIsRecording(true);
            toast({ title: "Recording Started", description: "Speak into your microphone." });

        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast({ variant: "destructive", title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser." });
        }
    }
  };

  const handleGenerateGraph = async () => {
    if (!data) {
      toast({ variant: "destructive", title: "No Data", description: "Please input data to generate a graph." });
      return;
    }
    setLoading(prev => ({ ...prev, isGeneratingGraph: true }));
    setGraphImage('');
    try {
      const result = await generateGraphNetwork({ data, modelType: model });
      setGraphImage(result.graphDataUri);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Generating Graph", description: "An unexpected error occurred." });
    } finally {
      setLoading(prev => ({ ...prev, isGeneratingGraph: false }));
    }
  };
  
  const handleRefreshGraph = () => {
    if (data) {
        handleGenerateGraph();
    } else {
        toast({
            title: "Nothing to refresh",
            description: "There is no data to generate a new graph from.",
        });
    }
  };

  const handleSummarize = async () => {
    if (!data) {
      toast({ variant: "destructive", title: "No Data", description: "Please input data to generate a summary." });
      return;
    }
    setLoading(prev => ({ ...prev, isSummarizing: true }));
    setSummary('');
    try {
      const result = await summarizeUploadedData({ data });
      setSummary(result.summary);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Generating Summary", description: "An unexpected error occurred." });
    } finally {
      setLoading(prev => ({ ...prev, isSummarizing: false }));
    }
  };

  const handleQuery = async () => {
    if (!data) {
      toast({ variant: "destructive", title: "No Data", description: "Please input data before querying." });
      return;
    }
    if (!query) {
      toast({ variant: "destructive", title: "No Query", description: "Please enter a query." });
      return;
    }
    setLoading(prev => ({ ...prev, isQuerying: true }));
    setAnswer('');
    try {
      const result = await queryDataWithLLM({ data, query });
      setAnswer(result.answer);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Querying Data", description: "An unexpected error occurred." });
    } finally {
      setLoading(prev => ({ ...prev, isQuerying: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline">VisAIge</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline">Controls</CardTitle>
                <CardDescription>Input your data and select an LLM to begin.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Tabs defaultValue="text">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2"/>Text</TabsTrigger>
                    <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2"/>File</TabsTrigger>
                    <TabsTrigger value="audio"><Mic className="w-4 h-4 mr-2"/>Audio</TabsTrigger>
                  </TabsList>
                  <TabsContent value="text" className="mt-4">
                    <Textarea
                      placeholder="Paste your text or JSON data here..."
                      className="min-h-[150px]"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                    />
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4">
                    <Input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".txt,.json"
                    />
                    <Button className="w-full" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2"/>
                        Upload a .txt or .json file
                    </Button>
                  </TabsContent>
                  <TabsContent value="audio" className="mt-4">
                    <Button className="w-full" variant="outline" onClick={handleToggleRecording} disabled={loading.isTranscribing}>
                        {loading.isTranscribing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        ) : isRecording ? (
                            <Square className="w-4 h-4 mr-2 fill-current"/>
                        ) : (
                            <Mic className="w-4 h-4 mr-2"/>
                        )}
                        {loading.isTranscribing ? 'Transcribing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    {isRecording && <p className="text-sm text-muted-foreground text-center mt-2 animate-pulse">Recording in progress...</p>}
                  </TabsContent>
                </Tabs>
                
                <div className="space-y-2">
                  <Label htmlFor="llm-select">LLM Model</Label>
                  <Select value={model} onValueChange={(value: 'GPT' | 'LLaMA' | 'DeepSeek') => setModel(value)}>
                    <SelectTrigger id="llm-select">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GPT">GPT</SelectItem>
                      <SelectItem value="LLaMA">LLaMA</SelectItem>
                      <SelectItem value="DeepSeek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerateGraph} disabled={loading.isGeneratingGraph}>
                  {loading.isGeneratingGraph && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Graph
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSummarize} disabled={loading.isSummarizing} className="w-full mb-4">
                  {loading.isSummarizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Summarize Data
                </Button>
                {loading.isSummarizing ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[60px]">
                    {summary || 'Click the button to generate a summary of your data.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline">Query Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Ask a question about your data..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  />
                  <Button onClick={handleQuery} disabled={loading.isQuerying} variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {loading.isQuerying ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[40px]">
                    {answer || 'Ask a question to get an answer from the AI.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-2/3">
            <Card className="shadow-md sticky top-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <CardTitle className="font-headline">Graph Visualization</CardTitle>
                    <CardDescription>Network generated from your data.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => z + 0.1)}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefreshGraph} disabled={loading.isGeneratingGraph}>
                      <RefreshCw className={`w-4 h-4 ${loading.isGeneratingGraph ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[600px] rounded-lg border bg-muted/30 flex items-center justify-center overflow-auto">
                  {loading.isGeneratingGraph ? (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
                      <BrainCircuit className="w-16 h-16" />
                      <p className="font-headline">Generating graph...</p>
                    </div>
                  ) : graphImage ? (
                     <div className="w-full h-full p-4 overflow-auto">
                        <img
                            src={graphImage}
                            alt="Generated Graph Network"
                            className="transition-transform duration-300 origin-center"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                        />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground p-8">
                        <BrainCircuit className="w-16 h-16" />
                        <p className="font-headline text-lg mt-4">Your Graph Appears Here</p>
                        <p className="max-w-xs">Input your data and click "Generate Graph" to visualize the network of relationships and concepts within it.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
