import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './CreateListingModal.css';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'product' | 'service';
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  // New state for the image file
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to post a listing.');
      return;
    }

    setIsSubmitting(true);
    let imageUrl = '';

    // 1. Upload the image if one was selected
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Organizes files by user ID

      const { error: uploadError,} = await supabase.storage
        .from('listings') // Make sure this matches your bucket name in Supabase
        .upload(filePath, imageFile);

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Get the public URL of the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath);
        
      imageUrl = publicUrlData.publicUrl;
    }

    // 2. Insert the database record
    const tableName = type === 'product' ? 'products' : 'services';

    const { error: supabaseError } = await supabase
      .from(tableName)
      .insert([
        {
          title,
          description,
          price: parseFloat(price),
          category,
          user_id: user.id,
          image_url: imageUrl, // Save the Supabase storage URL
        }
      ]);

    if (supabaseError) {
      setError(supabaseError.message);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageFile(null);
      
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Create a new {type}</h2>
        
        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={`E.g., Web Design, Handmade Soap...`}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input 
              type="text" 
              required 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="E.g., Electronics, Consulting"
            />
          </div>

          <div className="form-group">
            <label>Price (R)</label>
            <input 
              type="number" 
              required 
              min="0"
              step="0.01"
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="0.00"
            />
          </div>

          {/* Replaced URL input with File input */}
          <div className="form-group form-group-full">
            <label>Upload Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange} 
            />
          </div>

          <div className="form-group form-group-full">
            <label>Description</label>
            <textarea 
              required 
              rows={4}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder={`Describe your ${type}...`}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};