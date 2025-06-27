
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import {
  BrainCircuit,
  ChevronDown,
  FileText,
  Loader2,
  Mic,
  RefreshCw,
  Search,
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
import { transcribeAudio } from '@/ai/flows/transcribe-audio';

type LoadingStates = {
  isGeneratingGraph: boolean;
  isQuerying: boolean;
  isTranscribing: boolean;
};

export default function VisAigePage() {
  const { toast } = useToast();
  const [data, setData] = useState('');
  const [model, setModel] = useState<'GPT' | 'LLaMA' | 'DeepSeek'>('GPT');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [graphImage, setGraphImage] = useState('');
  const [zoom, setZoom] = useState(1);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [loading, setLoading] = useState<LoadingStates>({
    isGeneratingGraph: false,
    isQuerying: false,
    isTranscribing: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAudioFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload an audio file.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setLoading((prev) => ({ ...prev, isTranscribing: true }));
        try {
          const result = await transcribeAudio({ audioDataUri: base64Data });
          setData(result.transcript);
          toast({
            title: 'Audio Transcribed',
            description:
              'Your audio has been converted to text and loaded into the data input.',
          });
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Error Transcribing',
            description: 'Could not transcribe audio.',
          });
        } finally {
          setLoading((prev) => ({ ...prev, isTranscribing: false }));
        }
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'File Error',
          description: 'There was an error reading the audio file.',
        });
      };
      reader.readAsDataURL(file);
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
      setIsGraphExpanded(true);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error Generating Graph", description: "An unexpected error occurred." });
    } finally {
      setLoading(prev => ({ ...prev, isGeneratingGraph: false }));
    }
  };
  
  const handleRefreshGraph = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data) {
        handleGenerateGraph();
    } else {
        toast({
            title: "Nothing to refresh",
            description: "There is no data to generate a new graph from.",
        });
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
                    <Input
                      id="audio-file-upload"
                      type="file"
                      ref={audioFileInputRef}
                      onChange={handleAudioFileChange}
                      className="hidden"
                      accept="audio/*"
                    />
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => audioFileInputRef.current?.click()}
                      disabled={loading.isTranscribing}
                    >
                      {loading.isTranscribing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {loading.isTranscribing ? 'Transcribing...' : 'Upload an audio file'}
                    </Button>
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
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline">Query - Answer</CardTitle>
                <CardDescription>Ask questions about your data and get AI-powered answers.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                    <Textarea
                        placeholder="Ask a question about your data..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleQuery();
                            }
                        }}
                        className="min-h-[100px]"
                    />
                    <Button onClick={handleQuery} disabled={loading.isQuerying} className="w-full">
                        {loading.isQuerying ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="mr-2 h-4 w-4" />
                        )}
                        Get Answer
                    </Button>
                </div>

                <div className="mt-6">
                    <Label>Answer</Label>
                    {loading.isQuerying ? (
                    <div className="space-y-2 mt-2 border rounded-md p-4 min-h-[420px]">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                    ) : (
                    <Textarea
                        readOnly
                        placeholder="The AI's answer will appear here."
                        className="text-sm text-muted-foreground min-h-[420px] bg-background mt-2"
                        value={answer}
                    />
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="cursor-pointer" onClick={() => setIsGraphExpanded(prev => !prev)}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <CardTitle className="font-headline">Graph Visualization</CardTitle>
                    <CardDescription>Network generated from your data. Click to expand.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setZoom(z => z + 0.1); }}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.2, z - 0.1)); }}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefreshGraph} disabled={loading.isGeneratingGraph}>
                      <RefreshCw className={`w-4 h-4 ${loading.isGeneratingGraph ? 'animate-spin' : ''}`} />
                    </Button>
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isGraphExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
              {isGraphExpanded &&
                <CardContent>
                  <div className="w-full h-[560px] rounded-lg border bg-muted/30 flex items-center justify-center overflow-auto">
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
              }
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
