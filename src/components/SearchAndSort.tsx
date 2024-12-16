interface SearchAndSortProps {
  search: string;
  setSearch: (value: string) => void;
  sortBy: 'name' | 'price' | 'difference';
  setSortBy: (value: 'name' | 'price' | 'difference') => void;
}

const SearchAndSort = ({ search, setSearch, sortBy, setSortBy }: SearchAndSortProps) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
      />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'difference')}
        className="p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
      >
        <option value="name">Sort by Name</option>
        <option value="price">Sort by Price</option>
        <option value="difference">Sort by Difference</option>
      </select>
    </div>
  );
};

export default SearchAndSort;