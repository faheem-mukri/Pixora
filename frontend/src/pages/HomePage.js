import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import InfiniteScroll from 'react-infinite-scroll-component';
import LoadingSpinner from '../components/LoadingSpinner';
import RecommendationsBanner from '../components/RecommendationsBanner';
import './HomePage.css';

function HomePage() {
    const [images, setImages] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const navigate = useNavigate();

    //fetch image from backend
    const fetchImages = async (isNewSearch = false) => {
        try {
            const currentPage = isNewSearch ? 1 : page;
            const endpoint = `/api/search/curated?page=${currentPage}&per_page=30`;

            const response = await axios.get(`http://localhost:5000${endpoint}`);

            if (isNewSearch) {
                setImages(response.data.photos);
                setPage(2);
                setIsInitialLoading(false);
            } else {
                setImages([...images, ...response.data.photos]);
                setPage(page + 1);
            }

            if (response.data.photos.length < 30) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            setIsInitialLoading(false);
        }
    };

    // load initial images on component mount
    useEffect(() => {
        console.log('HomePage loaded'); // DEBUG
        fetchImages(true);
    }, []);

    // Handle image click - navigate to pin detail page
    const handleImageClick = (imageId) => {
        navigate(`/pin/${imageId}`);
    };

    return (
        <div className="home-page">
             {/* Recommendations Banner */}
            <RecommendationsBanner />

            {/* Masonry Grid with Natural Aspect Ratios */}
            {!isInitialLoading && (
                <InfiniteScroll
                    dataLength={images.length}
                    next={() => fetchImages(false)}
                    hasMore={hasMore}
                    loader={<LoadingSpinner key="loader" />}
                    threshold={0.8}
                >
                    <ResponsiveMasonry
                        columnsCountBreakPoints={{ 350: 3, 750: 4, 900: 5, 1200: 6 }}
                    >
                        <Masonry gutter="15px">
                            {images.map((image) => {
                                // Calculate aspect ratio from image dimensions
                                const aspectRatio = image.height / image.width;
                                
                                return (
                                    <div key={image.id} className="image-card-wrapper">
                                        <div 
                                            className="image-card"
                                            style={{
                                                paddingBottom: `${aspectRatio * 100}%`
                                            }}
                                            onClick={() => handleImageClick(image.id)}
                                        >
                                            <img
                                                src={image.src.large}
                                                alt={image.alt || 'Pinterest image'}
                                                className="image"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </Masonry>
                    </ResponsiveMasonry>
                </InfiniteScroll>
            )}
        </div>
    );
}

export default HomePage;
