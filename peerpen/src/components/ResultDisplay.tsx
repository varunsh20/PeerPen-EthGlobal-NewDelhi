import { Box, Text, VStack } from '@chakra-ui/react';

interface Result {
  blobId: string;
  content: string;
}

interface Props {
  results: Result[];
}

const ResultDisplay = ({ results }: Props) => {
  console.log(results)
  return (
    <VStack spacing={4}>
      {results.map((result) => (
        <Box key={result.blobId} p={2} borderWidth={1} borderRadius="md" width="100%">
          <Text>Blob ID: {result.blobId}</Text>
          <Text whiteSpace="pre-wrap">Content: {result.content}</Text>
        </Box>
      ))}
    </VStack>
  );
};

export default ResultDisplay;