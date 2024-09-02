<?php

  function register_feed_route() {
    register_rest_route('midlandjobs/v1', 'customFeed', [
      'methods'  => WP_REST_SERVER::READABLE,
      'callback' => 'midlandjobs_feed_api'
    ]);
  }
  add_action('rest_api_init', 'register_feed_route');

  function midlandjobs_feed_api($data) {

    // we do first some basic error handling
    // url NOT set
    if (false === isset($data['url']) ) {
      return ['error' => 'Please provide a URL to a valid XML source.'];
    } 
    // url IS set
    else {

      // if URL empty
      if (true === empty($data['url'])) {
        return ['error' => 'Please provide a URL to a valid XML source.'];

        // if URL NOT empty
      } else {

        // invalid url check
        if (filter_var($data['url'], FILTER_VALIDATE_URL) === FALSE) {
          return ['error' => 'The URL provided is not valid.'];
        }

        // URL is valid...
        else {

          // check for valid xml resource...
          if (strpos($data['url'], ".xml") == false) {
            return ['error' => 'The URL provided is not for valid XML resource.'];
          }

        }

      }

    }

    // fetch XML using CURL. script should be killed before it reaches here according to above checks
    $c = curl_init();
    curl_setopt_array($c, array(
      CURLOPT_URL => $data['url'],
      CURLOPT_HEADER => false,
      CURLOPT_TIMEOUT => 10,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_SSL_VERIFYPEER => 0, 
      CURLOPT_SSL_VERIFYHOST => 0
    ));
    $r = curl_exec($c);
    curl_close($c);

    // nothing returned?
    if(!$r) {
      return ['error' => 'No result gotten from request. Please check the URL provided.'];
    }

    return new SimpleXMLElement($r);

  }