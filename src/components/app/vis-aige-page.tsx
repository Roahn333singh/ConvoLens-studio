
"use client";

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import {
  BrainCircuit,
  ChevronDown,
  FileText,
  Loader2,
  Mic,
  Paintbrush,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateGraphNetwork, type GenerateGraphNetworkOutput } from '@/ai/flows/generate-graph-network';
import { queryDataWithLLM } from '@/ai/flows/query-data-with-llm';
import { summarizeUploadedData } from '@/ai/flows/summarize-uploaded-data';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import KnowledgeGraph from './knowledge-graph';


type LoadingStates = {
  isGeneratingGraph: boolean;
  isQuerying: boolean;
  isTranscribing: boolean;
  isSummarizing: boolean;
};

export default function ConvoLensPage() {
  const { toast } = useToast();
  const [data, setData] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [graphData, setGraphData] = useState<GenerateGraphNetworkOutput | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [loading, setLoading] = useState<LoadingStates>({
    isGeneratingGraph: false,
    isQuerying: false,
    isTranscribing: false,
    isSummarizing: false,
  });

  const [activeTab, setActiveTab] = useState('text');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState('theme-default');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-default', 'theme-ocean', 'theme-forest');
    root.classList.add(theme);
  }, [theme]);
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAnswer('');
      setQuery('');
      setGraphData(null);
      setAudioFile(null);
      setAudioDataUri(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          let processedData = text;

          if (file.name.toLowerCase().endsWith('.json')) {
            try {
              const jsonData = JSON.parse(text);
              if (jsonData?.root?.content && Array.isArray(jsonData.root.content)) {
                processedData = jsonData.root.content
                  .map((block: any) => `${block.actor || 'SPEAKER'}: ${block.dialogue || ''}`)
                  .join('\n');
              } else {
                 toast({
                    variant: "destructive",
                    title: "Invalid JSON Format",
                    description: "The JSON file does not have the expected 'root.content' structure.",
                });
              }
            } catch (jsonError) {
                toast({
                    variant: "destructive",
                    title: "JSON Parse Error",
                    description: "Could not parse the JSON file. Please ensure it is valid.",
                });
            }
          }
          setData(processedData);
          toast({
            title: "File Loaded",
            description: `${file.name} has been loaded.`,
          });
        } catch (error) {
            const description = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: "destructive", title: "File Error", description });
        } finally {
            if (event.target) {
              event.target.value = '';
            }
        }
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
      setAudioFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setAudioDataUri(base64Data);
        toast({
          title: 'Audio File Loaded',
          description: `${file.name} is ready for transcription.`,
        });
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

  const handleGetTranscript = async () => {
    if (!audioDataUri) {
      toast({
        variant: 'destructive',
        title: 'No Audio File',
        description: 'Please upload an audio file first.',
      });
      return;
    }
    setLoading((prev) => ({ ...prev, isTranscribing: true }));
    setAnswer('');
    setQuery('');
    setGraphData(null);

    try {
      const result = await transcribeAudio({ audioDataUri });
      setData(result.transcript);
      setActiveTab('text');
      toast({
        title: 'Audio Transcribed',
        description:
          'Your audio has been converted to text and loaded into the data input.',
      });
    } catch (error) {
      console.error(error);
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Transcription Failed',
        description: description,
      });
    } finally {
      setLoading((prev) => ({ ...prev, isTranscribing: false }));
    }
  };

  const handleGenerateGraph = async () => {
    if (!data) {
      toast({ variant: "destructive", title: "No Data", description: "Please input data to generate a graph." });
      return;
    }
    setLoading(prev => ({ ...prev, isGeneratingGraph: true }));
    setGraphData(null);
    try {
      console.log("Sending to generateGraphNetwork:", { transcript: data });
      const result = await generateGraphNetwork({ transcript: data });
      setGraphData(result);
      if (!isGraphExpanded) {
        setIsGraphExpanded(true);
      }
    } catch (error) {
      console.error(error);
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: "destructive", title: "Error Generating Graph", description: description });
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
    } catch (error)
      {
      console.error(error);
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: "destructive", title: "Error Querying Data", description: description });
    } finally {
      setLoading(prev => ({ ...prev, isQuerying: false }));
    }
  };

  const isLoading = loading.isGeneratingGraph || loading.isQuerying || loading.isSummarizing || loading.isTranscribing;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center justify-between">
            <div className='flex items-center gap-2'>
              <BrainCircuit className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold font-headline">ConvoLens</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Paintbrush className="h-4 w-4" />
                  <span className="sr-only">Change Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('theme-default')}>
                    Default
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('theme-ocean')}>
                    Ocean
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('theme-forest')}>
                    Forest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Inputs */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline">Controls</CardTitle>
                <CardDescription>Input data and ask a question.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label>Data Input</Label>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2"/>Text</TabsTrigger>
                      <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2"/>File</TabsTrigger>
                      <TabsTrigger value="audio"><Mic className="w-4 h-4 mr-2"/>Audio</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="mt-4">
                      <Textarea
                        placeholder="Paste text, upload a file, or transcribe audio..."
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
                      <Button className="w-full" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                        {loading.isSummarizing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        ) : (
                          <Upload className="w-4 h-4 mr-2"/>
                        )}
                        {loading.isSummarizing ? 'Loading...' : 'Upload .txt or .json'}
                      </Button>
                    </TabsContent>
                    <TabsContent value="audio" className="mt-4">
                      <div className="flex flex-col gap-4">
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
                          disabled={isLoading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload an audio file
                        </Button>
                        {audioFile && (
                          <div className="text-sm text-muted-foreground text-center">
                            Loaded: <span className="font-medium text-foreground">{audioFile.name}</span>
                          </div>
                        )}
                        <Button
                          onClick={handleGetTranscript}
                          disabled={loading.isTranscribing || !audioFile}
                          className="w-full"
                        >
                          {loading.isTranscribing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mic className="w-4 h-4 mr-2" />
                          )}
                          {loading.isTranscribing ? 'Transcribing...' : 'Get Transcript'}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <Button onClick={handleGenerateGraph} disabled={isLoading || !data}>
                  {loading.isGeneratingGraph && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Graph
                </Button>

                <Separator className="my-2" />
                
                <div className="space-y-2">
                    <Label htmlFor="query-input">Query</Label>
                    <Textarea
                        id="query-input"
                        placeholder="Ask a question about your data..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleQuery();
                            }
                        }}
                        className="min-h-[120px]"
                    />
                </div>
                <Button onClick={handleQuery} disabled={isLoading || !data} className="w-full">
                    {loading.isQuerying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="mr-2 h-4 w-4" />
                    )}
                    Get Answer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outputs */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="font-headline">Answer</CardTitle>
                <CardDescription>The AI's response will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.isQuerying ? (
                  <div className="space-y-2 mt-2 border rounded-md p-4 h-[500px]">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-muted/30">
                     <p className="text-sm whitespace-pre-wrap">
                        {answer || "The AI's answer will appear here."}
                     </p>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="cursor-pointer" onClick={() => setIsGraphExpanded(prev => !prev)}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <CardTitle className="font-headline">Graph Visualization</CardTitle>
                    <CardDescription>Network Data.Click To Expand</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setZoom(z => z + 0.1); }}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.1, z - 0.1)); }}>
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
                  <div className={cn(
                    "w-full h-[600px] rounded-lg border bg-muted/30 relative",
                    !graphData?.nodes || graphData.nodes.length === 0 && "flex items-center justify-center"
                    )}>
                    {loading.isGeneratingGraph ? (
                      <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-muted-foreground animate-pulse">
                        <BrainCircuit className="w-16 h-16" />
                        <p className="font-headline">Generating graph...</p>
                      </div>
                    ) : graphData?.nodes && graphData.nodes.length > 0 ? (
                      <KnowledgeGraph 
                        nodes={graphData.nodes} 
                        relationships={graphData.relationships}
                        zoom={zoom}
                        setZoom={setZoom}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center text-muted-foreground p-8">
                          <BrainCircuit className="w-16 h-16" />
                          <p className="font-headline text-lg mt-4">Your Graph Appears Here</p>
                          <p className="max-w-xs">Input your data and click "Generate Graph" to visualize the network.</p>
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
