import { useState } from 'react';
import { Box, Input, Button, useToast } from '@chakra-ui/react';

const DocumentUploader = ({ onUpload }: { onUpload: (file: File) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleUpload = async () => {
    if (!file) return toast({ title: 'No file selected', status: 'error' });
    setLoading(true);
    try {
      await onUpload(file);
      toast({ title: 'Document uploaded and checked', status: 'success' });
    } catch (error) {
        console.log(error);
      toast({ title: 'Upload failed', status: 'error' });
    }
    setLoading(false);
  };
  return (
    <Box>
      <Input
        type="file"
        accept=".txt,.md"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        mb={4}
        bg="gray.700"
        borderColor="gray.600"
        color="white"
        _hover={{ borderColor: 'blue.400' }}
      />
      <Button
        onClick={handleUpload}
        isLoading={loading}
        colorScheme="blue"
        width="full"
        bg="blue.500"
        _hover={{ bg: 'blue.600' }}
      >
        Upload & Check
      </Button>
    </Box>
  );
};


export default DocumentUploader;