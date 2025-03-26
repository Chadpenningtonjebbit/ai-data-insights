"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, KeyIcon } from "lucide-react";

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem("openai_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      setSavedKey(storedKey);
      setStatus("success");
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKey) return;
    
    setIsSaving(true);
    
    // Simulate API call to validate key
    setTimeout(() => {
      try {
        // Store in localStorage
        localStorage.setItem("openai_api_key", apiKey);
        setSavedKey(apiKey);
        setStatus("success");
        
        // Reload the page to apply the new API key
        window.location.reload();
      } catch (error) {
        setStatus("error");
        console.error("Failed to save API key:", error);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleClearKey = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setSavedKey("");
    setStatus("idle");
    
    // Reload the page to apply the change
    window.location.reload();
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <KeyIcon className="mr-2 h-5 w-5 text-blue-500" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key to use the AI features. Your key is stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus("idle");
              }}
              className={`pr-10 ${
                status === "success" ? "border-green-500" : 
                status === "error" ? "border-red-500" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showKey ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button 
            onClick={handleSaveKey} 
            disabled={isSaving || !apiKey || apiKey === savedKey}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        
        {status === "success" && (
          <div className="mt-2 text-sm text-green-600 flex justify-between items-center">
            <span>API key saved successfully!</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearKey}
              className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Clear Key
            </Button>
          </div>
        )}
        
        {status === "error" && (
          <div className="mt-2 text-sm text-red-600">
            Failed to save API key. Please try again.
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500 border-t pt-4">
        <p>
          Your API key is stored only in your browser's local storage and is never sent to our servers.
          <br />
          Get your API key from{" "}
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            OpenAI's dashboard
          </a>.
        </p>
      </CardFooter>
    </Card>
  );
} 