export default function LayoutTest() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4">
      <h1 className="text-2xl font-bold mb-4">Layout Test</h1>

      <div className="flex w-full justify-center gap-4">
        <div className="w-[200px] h-[300px] bg-gray-100 border p-2">
          Left Panel
        </div>
        <div className="w-[400px] h-[300px] bg-gray-200 border p-2">
          Center Log Panel
        </div>
        <div className="w-[200px] h-[300px] bg-gray-100 border p-2">
          Right Panel
        </div>
      </div>
    </div>
  );
}
