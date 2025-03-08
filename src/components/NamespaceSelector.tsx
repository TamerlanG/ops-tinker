import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NamespaceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NamespaceSelector({ value, onChange }: NamespaceSelectorProps) {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNamespaces() {
      try {
        const response = await fetch('/api/kubernetes/namespaces');
        if (!response.ok) throw new Error('Failed to fetch namespaces');
        const data = await response.json();
        setNamespaces(data.namespaces.map((ns: any) => ns.metadata?.name).filter(Boolean));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch namespaces');
        setNamespaces(['default']); // Fallback to default namespace
      } finally {
        setLoading(false);
      }
    }

    fetchNamespaces();
  }, []);

  if (loading) return <div>Loading namespaces...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select namespace" />
      </SelectTrigger>
      <SelectContent>
        {namespaces.map((namespace) => (
          <SelectItem key={namespace} value={namespace}>
            {namespace}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 