import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Grid3x3, Edit3, BookOpen } from "lucide-react";

const Index = () => {
  return (
    <>
      {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-hero-gradient rounded-3xl p-16 mb-16">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Create engaging online tests with ease.
            </h2>
            <Link to="/form-builder">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-button px-8 py-4 text-lg font-semibold rounded-xl"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-card rounded-2xl p-8 shadow-feature-card border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Grid3x3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Categorize Questions
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Create interactive drag & drop categorization tasks.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-feature-card border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <Edit3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Cloze (Fill-in-the-blanks)
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Easily create fill-in-the-blank questions from sentences.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-feature-card border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Comprehension
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Add passages and build multiple-choice questions.
              </p>
            </div>
          </div>
        </div>
        </>
  );
};

export default Index;