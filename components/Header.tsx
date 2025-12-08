"use client";

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import logo from "@/images/logo.png";
import SearchBar from "./SearchBar";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Shield } from "lucide-react";

const ADMIN_EMAILS = ["dodinhkhang8@gmail.com", "hoanghiepta2005@gmail.com"];

function Header() {
  const { user } = useUser();
  const userRole = useQuery(
    api.users.getUserRole,
    user?.id ? { userId: user.id } : "skip"
  );

  const isAdmin = ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress || "");

  return (
    <div className="border-b">
      <div className="flex flex-col lg:flex-row items-center gap-4 p-4">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link href="/" className="font-bold shrink-0">
            <Image
              src={logo}
              alt="logo"
              width={100}
              height={100}
              className="w-24 lg:w-28"
            />
          </Link>

          <div className="lg:hidden">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Search Bar - Full width on mobile */}
        <div className="w-full lg:max-w-2xl">
          <SearchBar />
        </div>

        <div className="hidden lg:block ml-auto">
          <SignedIn>
            <div className="flex items-center gap-3">
              {/* Navigation dựa trên role */}
              {userRole === "organizer" ? (
                <>
                  <Link href="/seller/dashboard">
                    <button className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition">
                      Dashboard
                    </button>
                  </Link>
                  <Link href="/seller/new-event">
                    <button className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-700 transition">
                      Create Event
                    </button>
                  </Link>
                  <Link href="/seller/events">
                    <button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                      My Events
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/tickets">
                    <button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                      My Tickets
                    </button>
                  </Link>
                </>
              )}
              
              {/* Admin Button - chỉ hiển thị cho admin */}
              {isAdmin && (
                <Link href="/admin/migration">
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center gap-2 shadow-md">
                    <Shield className="w-4 h-4" />
                    Admin
                  </button>
                </Link>
              )}
              
              <Link href="/settings">
                <button className="bg-purple-100 text-purple-800 px-3 py-1.5 text-sm rounded-lg hover:bg-purple-200 transition border border-purple-300">
                  Settings
                </button>
              </Link>
              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden w-full flex justify-center gap-2">
          <SignedIn>
            {userRole === "organizer" ? (
              <>
                <Link href="/seller/dashboard" className="flex-1">
                  <button className="w-full bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition">
                    Dashboard
                  </button>
                </Link>
                <Link href="/seller/events" className="flex-1">
                  <button className="w-full bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                    My Events
                  </button>
                </Link>
              </>
            ) : (
              <Link href="/tickets" className="flex-1">
                <button className="w-full bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
                  My Tickets
                </button>
              </Link>
            )}
            
            {/* Admin Button Mobile - chỉ hiển thị cho admin */}
            {isAdmin && (
              <Link href="/admin/migration">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center gap-2 shadow-md">
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              </Link>
            )}
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export default Header;
