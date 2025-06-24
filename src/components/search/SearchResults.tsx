
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isVisible: boolean;
}

export const SearchResults = ({ results, isVisible }: SearchResultsProps) => {
  if (!isVisible || results.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[400px] overflow-y-auto z-50">
      {results.map((product) => (
        <Link to={`/products/${product.id}`} key={product.id}>
          <Card className="flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors">
            <img
              src={product.image}
              alt={product.name}
              className="h-12 w-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">{product.name}</h4>
              <p className="text-xs text-gray-500">{product.category}</p>
            </div>
            <span className="text-sm font-medium text-brand-primary">{product.price.toFixed(2)} kr</span>
          </Card>
        </Link>
      ))}
    </div>
  );
};
