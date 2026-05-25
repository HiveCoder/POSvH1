import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from './ui';
import { Textarea } from './ui/textarea';
import type { MenuItem } from '../store/pos-store';

interface MenuItemEditDialogProps {
  open: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (itemCode: string, updates: {
    item_name: string;
    description: string;
    rate: number;
    course: string;
    course_label: string;
    item_image: string;
    special_dish: 0 | 1;
  }) => void;
}

const MenuItemEditDialog: React.FC<MenuItemEditDialogProps> = ({ open, item, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('0');
  const [course, setCourse] = useState('');
  const [courseLabel, setCourseLabel] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [specialDish, setSpecialDish] = useState<0 | 1>(0);

  useEffect(() => {
    if (!item) return;

    setName(item.item_name || item.name || '');
    setDescription(item.description || '');
    setRate(String(item.price ?? 0));
    setCourse(item.course || '');
    setCourseLabel(item.course_label || item.course || '');
    setItemImage(item.image || '');
    setSpecialDish(item.special_dish || 0);
  }, [item]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      if (base64) setItemImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!item) return;

    const numericRate = Number(rate);
    onSave(item.item, {
      item_name: name.trim() || item.item_name,
      description: description.trim(),
      rate: Number.isFinite(numericRate) ? numericRate : item.price,
      course: course.trim() || item.course,
      course_label: courseLabel.trim() || course.trim() || item.course_label || item.course,
      item_image: itemImage.trim(),
      special_dish: specialDish,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : null)}>
      <DialogContent size="2xl" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-4 px-6 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                <Input value={item.item} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
                placeholder="Write a full item description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Key</label>
                <Input value={course} onChange={(e) => setCourse(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Label</label>
                <Input value={courseLabel} onChange={(e) => setCourseLabel(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL or Base64</label>
              <Input
                value={itemImage}
                onChange={(e) => setItemImage(e.target.value)}
                placeholder="https://... or data:image/..."
              />
              <div className="flex items-center gap-3 mt-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <ImagePlus className="w-4 h-4" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItemImage(`/demo-images/filipino/${item.item.toLowerCase()}.jpg`)}
                >
                  Use Default Local Photo
                </Button>
              </div>
            </div>

            {(itemImage || item.image) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                <img
                  src={itemImage || item.image || ''}
                  alt={name || item.item_name}
                  className="w-full md:w-80 h-48 object-cover rounded-md border border-gray-200"
                />
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={specialDish === 1}
                onChange={(e) => setSpecialDish(e.target.checked ? 1 : 0)}
                className="rounded border-gray-300"
              />
              Mark as Special Dish
            </label>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemEditDialog;
