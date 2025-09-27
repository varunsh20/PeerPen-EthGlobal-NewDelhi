import { useState } from 'react';
import { Button, useToast , Box} from '@chakra-ui/react';
import { ethers } from 'ethers';
import {useActiveAccount } from 'thirdweb/react';


const SubscribeComponent = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const account = useActiveAccount();
  
  const handlePayment = async () => {
    setLoading(true);
    if (!window.ethereum) return toast({ title: 'MetaMask required', status: 'error' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract("0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9",
      ['function transfer(address to, uint256 amount) public returns (bool)'],
      signer
    );
    try {
      const tx = await contract.transfer("0x910Bc07D7758BA1F17A2daC5Fe8E9168c1D2a2b9",ethers.utils.parseUnits('1.0', 6));
      localStorage.setItem(`subscribed_${account?.address}`, 'true');
      toast({ title: 'Payment sent', status: 'success' });
    } catch (error) {
      toast({ title: 'Payment failed', status: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box>
      <Button
        onClick={handlePayment}
        isLoading={loading}
        colorScheme="green"
        width="full"
        bg="green.500"
        _hover={{ bg: 'green.600' }}
      >
        Subscribe With PYUSD
      </Button>
    </Box>
  );
};

export default SubscribeComponent;