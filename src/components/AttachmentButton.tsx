import { Paperclip } from 'lucide-react';
import { appCacheDir } from '@tauri-apps/api/path';
import { writeFile } from '@tauri-apps/plugin-fs';

interface AttachmentButtonProps {
  onAdd: (paths: string[]) => void;
}

export function AttachmentButton({ onAdd }: AttachmentButtonProps) {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const paths: string[] = [];

    try {
      const cacheDir = await appCacheDir();

      for (const file of files) {
        // 生成唯一文件名
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${cacheDir}${fileName}`;

        // 读取文件并保存到缓存目录
        const buffer = await file.arrayBuffer();
        await writeFile(filePath, new Uint8Array(buffer));

        paths.push(filePath);
      }

      onAdd(paths);
      alert(`成功添加 ${paths.length} 个附件`);
    } catch (error) {
      console.error('保存附件失败:', error);
      alert('附件保存失败: ' + error);
    }

    // 清空 input
    e.target.value = '';
  };

  return (
    <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded flex items-center gap-2 transition-colors">
      <Paperclip size={16} />
      <span>附件</span>
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </label>
  );
}
