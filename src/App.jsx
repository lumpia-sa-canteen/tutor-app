import ParallaxScene from './components/ParallaxScene/ParallaxScene';
import MainMenu from './components/MainMenu/MainMenu';
import { menuItems } from './data/menuItems';

export default function App() {
  const handleSelect = (id) => {
    console.log('Selected:', id);
  };

  return (
    <ParallaxScene image="/resources/theresa1.jpg">
      <MainMenu items={menuItems} onSelect={handleSelect} />
    </ParallaxScene>
  );
}