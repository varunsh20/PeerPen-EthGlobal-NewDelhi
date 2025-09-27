import { useState, useEffect } from 'react';
import { ChakraProvider, VStack, Heading, Text, Box, Flex, Badge, extendTheme} from '@chakra-ui/react';
import { ConnectButton, useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import DocumentUploader from './components/DocumentUploader';
import ResultDisplay from './components/ResultDisplay';
import SubscriptionButton from './components/SubscribeComponent';
import axios from 'axios';
import { client } from './thirdwebclient';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  components: {
    Box: {
      baseStyle: {
        borderWidth: '1px',
        borderColor: 'gray.700',
        borderRadius: 'md',
        bg: 'gray.800',
        p: 4,
      },
    },
    Button: {
      baseStyle: {
        borderRadius: 'md',
        _hover: {
          bg: 'gray.600',
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'white',
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.200',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'sm',
        px: 2,
        py: 1,
      },
    },
  },
});

function App() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const [checkCount, setCheckCount] = useState(0);
  const [results, setResults] = useState<{ blobId: string; content: string }[]>([]);

  const [isSubscribed, setIsSubscribed] = useState(!!localStorage.getItem(`subscribed_${account?.address}`));
  

  useEffect(() => {
    if (account?.address) {
      axios.get(`http://localhost:3001/api/check-count?userId=${account.address}`)
        .then((res) => setCheckCount(res.data.count))
        .catch(() => setCheckCount(0));
        setIsSubscribed(!!localStorage.getItem(`subscribed_${account.address}`));
    }
  }, [account?.address, activeChain, switchChain]);

  const handleUpload = async (file: File) => {
    if (!account?.address) return alert('Please connect wallet');
    const response = await axios.post(`http://localhost:3003/api/upload?userId=${account.address}`, file, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const blobId  = response.data.blobId;
  
    const checkResult = await axios.post('http://localhost:3001/api/check', { blobId, userId: account.address });
    console.log(checkResult.data);
    setResults([...results, { blobId, content: checkResult.data.content }]);
    setCheckCount(checkCount + 1);
  };

  const handleSubscribe = async (txHash: string) => {
    if (!account?.address) return alert('Please connect wallet');
    const response = await axios.post('http://localhost:3002/api/subscribe', { userId: account.address, txHash });
    if (response.data.success) {
      setIsSubscribed(true);
      alert('Subscription successful!');
    }
  };

//   return (
//     <ChakraProvider>
//       <VStack p={4} spacing={4}>
//         <Heading>PeerPen</Heading>
//         <Box>
//           <ConnectButton client={client} />
//           {account?.address && <Text>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</Text>}
//         </Box>
//         <Text>Checks remaining: {isSubscribed ? 'Unlimited (Premium)' : 2 - checkCount}</Text>
//         {!isSubscribed && checkCount >= 2 && <SubscriptionButton onSubscribe={handleSubscribe} />}
//         <DocumentUploader onUpload={handleUpload} />
//         <ResultDisplay results={results} />
//       </VStack>
//     </ChakraProvider>
//   );
// }
// return (
//   <ChakraProvider>
//     <VStack p={4} spacing={4} position="relative">
//       <Flex justify="space-between" width="100%">
//         <Heading>PeerPen</Heading>
//         {isSubscribed && (
//           <Badge colorScheme="green" position="absolute" top={2} right={2}>
//             Premium
//           </Badge>
//         )}
//       </Flex>
//       <Box>
//         <ConnectButton client={client} />
//         {account?.address && <Text>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</Text>}
//       </Box>
//       {checkCount < 2 && !isSubscribed && <Text>Checks remaining: {2 - checkCount}</Text>}
//       {(checkCount >= 2 && !isSubscribed) && <SubscriptionButton />}
//       {(isSubscribed || checkCount < 2) && <DocumentUploader onUpload={handleUpload} />}
//       <ResultDisplay results={results} />
//     </VStack>
//   </ChakraProvider>
return (
  <ChakraProvider theme={theme}>
    <VStack p={6} spacing={6} maxW="800px" mx="auto">
      <Box w="100%">
        <Flex justify="space-between" align="center">
          <Heading size="lg">PeerPen</Heading>
          {isSubscribed && (
            <Badge colorScheme="green" position="absolute" top={4} right={4}>
              Premium
            </Badge>
          )}
        </Flex>
      </Box>
      <Box w="100%">
        <ConnectButton client={client} />
        {account?.address && (
          <Text mt={2}>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</Text>
        )}
      </Box>
      {checkCount <2  && !isSubscribed && (
        <Box w="100%">
          <Text>Checks remaining: {2 - checkCount}</Text>
        </Box>
      )}
      {checkCount >= 2 && !isSubscribed && (
        <Box w="100%">
          <SubscriptionButton />
        </Box>
      )}
      {(isSubscribed || checkCount < 2) && (
        <Box w="100%">
          <DocumentUploader onUpload={handleUpload} />
        </Box>
      )}
      <Box w="100%">
        <ResultDisplay results={results} />
      </Box>
    </VStack>
  </ChakraProvider>
);
}

export default App;