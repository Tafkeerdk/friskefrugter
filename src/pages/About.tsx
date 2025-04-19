
import { Leaf, Truck, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <div className="relative h-[40vh] bg-green-600">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=2000&q=80')"
          }}
        />
        <div className="container mx-auto px-4 h-full flex items-center relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Din partner i friske råvarer
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Vi leverer kvalitet og friskhed direkte til din virksomhed, hver dag.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-6 text-green-800">Vores Mission</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Hos FriskeFrugter stræber vi efter at revolutionere måden professionelle køkkener får deres råvarer på. 
            Vi kombinerer års erfaring inden for fødevarebranchen med moderne teknologi for at sikre den bedste 
            kvalitet og service til vores kunder.
          </p>
        </div>

        {/* Values Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/50 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Friskhed</h3>
                <p className="text-gray-600 text-sm">
                  Vi garanterer de friskeste råvarer leveret direkte fra producenter
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Levering</h3>
                <p className="text-gray-600 text-sm">
                  Pålidelig levering til din dør, når du har brug for det
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Effektivitet</h3>
                <p className="text-gray-600 text-sm">
                  Hurtig og præcis ordrehåndtering gennem vores digitale platform
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Kvalitet</h3>
                <p className="text-gray-600 text-sm">
                  Højeste kvalitetsstandarder og fødevaresikkerhed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600">Tilfredse kunder</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Leveringspræcision</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
