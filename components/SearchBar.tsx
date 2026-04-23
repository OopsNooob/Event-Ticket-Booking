"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// Import Convex nếu bạn muốn làm dropdown live search (Gợi ý kết quả) ngay tại ô tìm kiếm
// import { useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";

// 1. Custom Hook useDebounce tự viết (không cần chạy npm install)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Đặt bộ đếm thời gian để update giá trị sau 'delay' ms
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Xóa bộ đếm nếu user tiếp tục gõ (chưa hết delay)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  
  // 2. Áp dụng Debounce 500ms cho chuỗi tìm kiếm
  const debouncedQuery = useDebounce(query, 500);

  // ========================================================================
  // 3. TÍCH HỢP API CONVEX (ADD ID 56)
  // Mở comment dòng dưới nếu bạn muốn API trả về kết quả gợi ý ngay bên dưới ô search.
  // API sẽ chỉ được gọi 1 lần sau khi user ngừng gõ 500ms.
  // ========================================================================
  // const searchResults = useQuery(api.events.search, { searchTerm: debouncedQuery });

  // 4. (Tùy chọn) Tự động chuyển trang tìm kiếm khi user ngừng gõ
  /*
  useEffect(() => {
    if (debouncedQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
    }
  }, [debouncedQuery, router]);
  */

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for events..."
          className="w-full py-3 px-4 pl-12 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Search
        </button>
      </form>
      
      {/* Gợi ý UI: Nếu bạn dùng searchResults từ Convex ở Bước 3, 
        bạn có thể render một cái Dropdown list các sự kiện tại đây. 
      */}
    </div>
  );
}