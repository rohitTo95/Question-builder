import React, { useState, useEffect } from 'react';
import { User, ChevronDown, Menu, X, BookOpen, PenTool, Sparkles, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 !shadow-[1px_1px_32px_-2px_hsl(174deg 81.98% 29.81% / 33%)]">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 max-w-7xl mx-auto">
        {/* Logo and Branding */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="group flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-lg flex items-center justify-center shadow-lg">
                <PenTool size={16} className="text-primary-foreground md:w-5 md:h-5" />
              </div>
              <Sparkles size={12} className="absolute -top-1 -right-1 text-primary animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                Question Builder
              </h1>
            </div>
          </Link>
        </div>
        
        {/* Navigation Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {!loading && isAuthenticated && user ? (
            <>
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-foreground hover:bg-muted/80 px-2 md:px-3 rounded-lg transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      {user.profile_img ? (
                        <img 
                          src={user.profile_img} 
                          alt={`${user.first_name} ${user.last_name}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-primary-foreground" />
                      )}
                    </div>
                    <span className="hidden sm:inline font-medium">
                      {user.first_name} {user.last_name}
                    </span>
                    <ChevronDown size={14} className="opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-card border border-border shadow-lg rounded-lg p-1 animate-in slide-in-from-top-1"
                >
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="hover:bg-muted cursor-pointer rounded-md mx-1 my-1">
                    <Link to="/form-builder" className="w-full flex items-center">
                      <BookOpen size={16} className="mr-2" />
                      Form Builder
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="hover:bg-destructive/10 cursor-pointer text-destructive rounded-md mx-1 my-1"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !loading ? (
            <>
              {/* Guest User Actions */}
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-foreground hover:bg-muted/80 transition-colors px-3 md:px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-200 px-3 md:px-4 font-medium"
                    style={{ boxShadow: 'var(--button-shadow)' }}
                  >
                    Get Started
                    <Sparkles size={14} className="ml-1.5 opacity-80" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;