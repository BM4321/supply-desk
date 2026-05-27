export default function ComingSoon({ title, icon, phase }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
        <i className={`ti ${icon} text-4xl text-gray-300 block mb-3`} />
        <h3 className="text-base font-medium text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">This section is coming up next.</p>
        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">{phase}</span>
      </div>
    </div>
  )
}
